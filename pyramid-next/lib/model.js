let generator = null;

export async function loadModel(onProgress) {
  if (typeof window === 'undefined') return null;
  if (generator) return generator;
  
  const { pipeline, env } = await import('@huggingface/transformers');
  
  // Prevent looking for local models on the web server directory
  env.allowLocalModels = false;
  env.useBrowserCache = true;

  const loggedFiles = new Set();

  const wrappedProgress = (data) => {
    if (data.status === 'initiate') {
      const file = data.file;
      if (!loggedFiles.has(file)) {
        loggedFiles.add(file);
        const cacheName = env.cacheKey || 'transformers-cache';
        if (typeof window !== 'undefined' && 'caches' in window) {
          caches.open(cacheName).then(cache => {
            cache.keys().then(keys => {
              const isCached = keys.some(req => req.url.includes(file));
              console.log(
                `%c[Model Load] ${file} — ${isCached ? 'CACHE HIT (loaded from browser cache)' : 'NETWORK FETCH (downloading from hub)'}`,
                isCached ? 'color: #10b981; font-weight: bold;' : 'color: #3b82f6; font-weight: bold;'
              );
            });
          }).catch(err => {
            console.warn('[Model Load] Failed to check cache status:', err);
          });
        }
      }
    }
    if (onProgress) {
      onProgress(data);
    }
  };

  generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
    device: 'webgpu',
    dtype: 'q4',
    progress_callback: wrappedProgress
  });
  
  return generator;
}

export async function generateResponse(prompt, onToken) {
  if (typeof window === 'undefined') return;
  if (!generator) {
    throw new Error("Model is not loaded. Call loadModel first.");
  }
  
  const { TextStreamer } = await import('@huggingface/transformers');
  
  const streamer = new TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    callback_function: onToken
  });
  
  const output = await generator(prompt, {
    streamer: streamer,
    max_new_tokens: 300,   // 512 was too generous — 300 covers most code answers
    do_sample: false,      // greedy decoding — much faster than sampling at low temp
  });
  
  return output;
}
