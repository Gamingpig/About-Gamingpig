/**
 * tts-worker.js - Neural AI TTS Web Worker
 * 
 * Runs client-side neural speech synthesis in a background thread using
 * @huggingface/transformers and ONNX Runtime Web.
 * 
 * If loading fails or environment doesn't support WASM/Workers, posts INIT_ERROR
 * allowing the main thread to fall back seamlessly to window.speechSynthesis.
 */

let ttsPipeline = null;
let isInitialized = false;
let currentLanguage = 'de';

// Language to voice configuration for Kokoro-82M ONNX
const VOICE_MAP = {
    de: 'bm_fable',   // German / Multi-lingual voice mapping
    en: 'af_heart',   // English high quality neural voice
    es: 'bm_george',  // Spanish mapping
    fr: 'bm_lewis',   // French mapping
    pt: 'bm_george',  // Portuguese mapping
    tr: 'bm_fable'    // Turkish mapping
};

self.onmessage = async function(e) {
    const { type, text, lang, voice, id } = e.data || {};

    if (type === 'INIT') {
        currentLanguage = lang || 'de';
        try {
            // Import Transformers.js via ESM inside Worker
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3');
            
            // Configure environment: browser ONNX runtime
            if (env && env.backends && env.backends.onnx) {
                env.backends.onnx.wasm.numThreads = 1;
                env.backends.onnx.wasm.proxy = false;
            }

            // Initialize Kokoro-82M TTS Pipeline (optimized quantized ONNX)
            ttsPipeline = await pipeline('text-to-speech', 'onnx-community/Kokoro-82M-ONNX', {
                dtype: 'fp32',
                device: 'wasm'
            });

            isInitialized = true;
            self.postMessage({ type: 'INIT_SUCCESS' });
        } catch (err) {
            console.warn('[TTS Worker] Neural WASM initialization failed, falling back:', err);
            isInitialized = false;
            self.postMessage({ type: 'INIT_ERROR', error: err ? err.message : 'Init failed' });
        }
        return;
    }

    if (type === 'SYNTHESIZE') {
        if (!isInitialized || !ttsPipeline) {
            self.postMessage({ type: 'SYNTH_ERROR', id, error: 'TTS engine not initialized' });
            return;
        }

        try {
            const requestedLang = lang || currentLanguage || 'de';
            const selectedVoice = voice || VOICE_MAP[requestedLang] || 'bm_fable';
            
            // Generate Speech waveform via neural model
            const output = await ttsPipeline(text, {
                speaker_id: selectedVoice
            });

            // Extract audio data & sample rate
            let audioArray = null;
            let sampleRate = 24000;

            if (output && output.audio) {
                audioArray = output.audio instanceof Float32Array ? output.audio : new Float32Array(output.audio);
                sampleRate = output.sampling_rate || 24000;
            }

            if (!audioArray || audioArray.length === 0) {
                throw new Error('No audio produced by model');
            }

            // Transfer Float32Array buffer to main thread (0-copy)
            self.postMessage({
                type: 'SYNTH_SUCCESS',
                id,
                audioBuffer: audioArray.buffer,
                sampleRate: sampleRate
            }, [audioArray.buffer]);
        } catch (err) {
            console.warn('[TTS Worker] Synthesis error:', err);
            self.postMessage({ type: 'SYNTH_ERROR', id, error: err ? err.message : 'Synth failed' });
        }
    }
};
