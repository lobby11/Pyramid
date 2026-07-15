const BACKEND_URL = 'http://localhost:8000';

export async function searchCodebase(query, scope = 'repo') {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (scope === 'file') {
    headers['X-Search-Scope'] = 'file';
  }
  
  const res = await fetch(`${BACKEND_URL}/search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query })
  });
  
  if (!res.ok) {
    throw new Error(`Search failed: ${res.statusText}`);
  }
  
  return await res.json();
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${BACKEND_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }
  
  return await res.json();
}

export async function checkBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/status`);
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function indexCodebasePath(path) {
  const res = await fetch(`${BACKEND_URL}/index`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  
  const data = await res.json();
  if (!res.ok || data.status === 'error') {
    throw new Error(data.message || `Indexing failed: ${res.statusText}`);
  }
  return data;
}

export async function getIndexingStatus() {
  const res = await fetch(`${BACKEND_URL}/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch status: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Upload collected .py file contents to POST /index-files.
 * @param {string} folderName  - display name of the root folder
 * @param {{ relativePath: string, content: string }[]} pyFiles
 */
export async function indexFiles(folderName, pyFiles) {
  const formData = new FormData();
  formData.append('folder_name', folderName);

  for (const { relativePath, content } of pyFiles) {
    const blob = new Blob([content], { type: 'text/plain' });
    // FastAPI reads file.filename from the Content-Disposition header
    formData.append('files', new File([blob], relativePath, { type: 'text/plain' }));
  }

  const res = await fetch(`${BACKEND_URL}/index-files`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || data.status === 'error') {
    throw new Error(data.message || `Indexing failed: ${res.statusText}`);
  }
  return data; // { status, files, chunks }
}
