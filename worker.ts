import { pipeline, env } from '@xenova/transformers';

// Skip local model checks since we are running in browser/GitHub Pages
env.allowLocalModels = false;

class PipelineSingleton {
  static task = 'automatic-speech-recognition' as const;
  static model = 'Xenova/whisper-base';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { type, audio } = event.data;

  if (type === 'load') {
    try {
      await PipelineSingleton.getInstance((data) => {
        // Relay progress messages back to main thread
        self.postMessage({
          status: 'progress',
          data: data
        });
      });
      self.postMessage({ status: 'ready' });
    } catch (e) {
      self.postMessage({ status: 'error', error: e.message });
    }
  }

  if (type === 'transcribe') {
    try {
      const transcriber = await PipelineSingleton.getInstance();
      
      const output = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: 'english',
        task: 'transcribe',
      });

      self.postMessage({
        status: 'complete',
        result: output.text,
      });
    } catch (e) {
      self.postMessage({ status: 'error', error: e.message });
    }
  }
});
