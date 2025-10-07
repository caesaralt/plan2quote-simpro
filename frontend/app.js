// Client‑side script for Plan2Quote
// Loads the standards JSON and handles file upload, preview generation, and committing quotes.

let apiBase = '';

// If the page is loaded with a ?api= parameter, use it for the backend base URL
(() => {
  const params = new URLSearchParams(window.location.search);
  const apiParam = params.get('api');
  if (apiParam) {
    apiBase = apiParam.replace(/\/$/, '');
  }
})();

// Helper to get selected automation categories
function getSelectedPackages() {
  const select = document.getElementById('automationType');
  return Array.from(select.selectedOptions).map((opt) => opt.value);
}

// Helper to render a preview table
function renderPreview(preview) {
  const container = document.getElementById('preview');
  container.innerHTML = '';
  // BOM table
  const bomTable = document.createElement('table');
  bomTable.innerHTML = '<caption>Bill of Materials</caption><thead><tr><th>SKU</th><th>Description</th><th>Qty</th></tr></thead><tbody></tbody>';
  preview.bom.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.sku}</td><td>${item.desc}</td><td>${item.qty}</td>`;
    bomTable.querySelector('tbody').appendChild(row);
  });
  // Labour table
  const labourTable = document.createElement('table');
  labourTable.innerHTML = '<caption>Labour</caption><thead><tr><th>Code</th><th>Hours</th></tr></thead><tbody></tbody>';
  preview.labor.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.code}</td><td>${item.hours}</td>`;
    labourTable.querySelector('tbody').appendChild(row);
  });
  // Price summary
  const priceDiv = document.createElement('div');
  priceDiv.innerHTML = `<p><strong>Materials:</strong> $${preview.price.materials.toFixed(2)}</p>\n<p><strong>Labour:</strong> $${preview.price.labor.toFixed(2)}</p>\n<p><strong>Total (ex. GST):</strong> $${preview.price.totalEx.toFixed(2)}</p>`;
  container.appendChild(bomTable);
  container.appendChild(labourTable);
  container.appendChild(priceDiv);
  container.style.display = 'block';
}

document.getElementById('previewBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('pdfFile');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please choose a PDF file first.');
    return;
  }
  const loadingEl = document.getElementById('loading');
  const previewContainer = document.getElementById('preview');
  const commitBtn = document.getElementById('commitBtn');
  previewContainer.style.display = 'none';
  commitBtn.style.display = 'none';
  loadingEl.style.display = 'block';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('packages', JSON.stringify(getSelectedPackages()));
  try {
    const res = await fetch(`${apiBase}/api/quote-runs`, {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to generate preview');
    window._currentRunId = json.runId;
    renderPreview(json.preview);
    commitBtn.style.display = 'inline-block';
  } catch (err) {
    alert(err.message);
  } finally {
    loadingEl.style.display = 'none';
  }
});

document.getElementById('commitBtn').addEventListener('click', async () => {
  const runId = window._currentRunId;
  if (!runId) return;
  const loadingEl = document.getElementById('loading');
  loadingEl.style.display = 'block';
  try {
    const res = await fetch(`${apiBase}/api/quote-runs/${runId}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: 'simpro', customer: {} })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to commit quote');
    alert(`Quote created in simPRO: ${json.quoteId}`);
  } catch (err) {
    alert(err.message);
  } finally {
    loadingEl.style.display = 'none';
  }
});
