const selectBtn = document.getElementById('selectBtn');
const resetBtn = document.getElementById('resetBtn');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const largestFilesList = document.getElementById('largestFiles');
const smallestFilesList = document.getElementById('smallestFiles');
const selectedPathElem = document.getElementById('selectedPath');
const progressContainer = document.querySelector('.progress-container');
const resultsContainer = document.querySelector('.results');

let scanning = false;

selectBtn.addEventListener('click', async () => {
  if (scanning) return;

  const folderPath = await window.electronAPI.openFolder();
  if (!folderPath) return;

  selectedPathElem.textContent = folderPath;
  resetBtn.disabled = true;
  largestFilesList.innerHTML = '';
  smallestFilesList.innerHTML = '';
  progressBar.value = 0;
  progressPercent.textContent = '0%';
  progressContainer.hidden = false;
  resultsContainer.hidden = true;

  scanning = true;
  selectBtn.disabled = true;

  // Listen for progress events from main process
  window.electronAPI.onScanProgress((progress) => {
    progressBar.value = progress;
    progressPercent.textContent = `${progress.toFixed(1)}%`;
  });

  try {
    const { largestFiles, smallestFiles } = await window.electronAPI.startScan(folderPath);
    displayFiles(largestFiles, largestFilesList);
    displayFiles(smallestFiles, smallestFilesList);

    progressBar.value = 100;
    progressPercent.textContent = `100%`;

    resultsContainer.hidden = false;

  } catch (err) {
    alert('Error scanning folder: ' + err.message);
  }

  scanning = false;
  selectBtn.disabled = false;
  resetBtn.disabled = false;
});

resetBtn.addEventListener('click', () => {
  if (scanning) return;
  selectedPathElem.textContent = 'No folder selected';
  largestFilesList.innerHTML = '';
  smallestFilesList.innerHTML = '';
  progressBar.value = 0;
  progressPercent.textContent = '0%';
  progressContainer.hidden = true;
  resultsContainer.hidden = true;
  resetBtn.disabled = true;
});

function displayFiles(files, container) {
  container.innerHTML = '';
  for (const file of files) {
    container.innerHTML += `<li>${file.path} — ${formatBytes(file.size)}</li>`;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}