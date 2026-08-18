/**
 * tts-worker.js - Ultra-Fast Neural AI TTS Web Worker
 * 
 * Uses @huggingface/transformers ONNX Web runtime for local neural speech synthesis.
 */

let ttsPipeline = null;
let isInitialized = false;
let initPromise = null;
let currentLanguage = 'de';

const VOICE_MAP = {
    de: 'bm_fable',   // Multi-lingual neural voice
    en: 'af_heart',   // English high quality neural voice
    es: 'bm_george',  // Spanish
    fr: 'bm_lewis',   // French
    pt: 'bm_george',  // Portuguese
    tr: 'bm_fable'    // Turkish
};

async function getPipeline() {
    if (isInitialized && ttsPipeline) return ttsPipeline;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // Load Transformers.js
        const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3');

        // Optimize ONNX environment
        if (env && env.backends && env.backends.onnx) {
            env.backends.onnx.wasm.numThreads = 1;
            env.backends.onnx.wasm.proxy = false;
        }

        // Initialize Kokoro-82M ONNX TTS
        ttsPipeline = await pipeline('text-to-speech', 'onnx-community/Kokoro-82M-ONNX', {
            dtype: 'fp32',
            device: 'wasm'
        });

        isInitialized = true;
        return ttsPipeline;
    })();

    return initPromise;
}

self.onmessage = async function(e) {
    const { type, text, lang, voice, id } = e.data || {};

    if (type === 'INIT') {
        currentLanguage = lang || 'de';
        try {
            await getPipeline();
            self.postMessage({ type: 'INIT_SUCCESS' });
        } catch (err) {
            console.warn('[TTS Worker] Neural initialization error:', err);
            isInitialized = false;
            initPromise = null;
            self.postMessage({ type: 'INIT_ERROR', error: err ? err.message : 'Init failed' });
        }
        return;
    }

    if (type === 'SYNTHESIZE') {
        try {
            const pipe = await getPipeline();
            const requestedLang = lang || currentLanguage || 'de';
            const speaker = voice || VOICE_MAP[requestedLang] || 'bm_fable';

            const output = await pipe(text, {
                speaker_id: speaker
            });

            let float32 = null;
            let sampleRate = 24000;

            if (output && output.audio) {
                float32 = output.audio instanceof Float32Array ? output.audio : new Float32Array(output.audio);
                sampleRate = output.sampling_rate || 24000;
            }

            if (!float32 || float32.length === 0) {
                throw new Error('Neural model produced empty audio');
            }

            // Transfer ArrayBuffer
            const buffer = float32.buffer;
            self.postMessage({
                type: 'SYNTH_SUCCESS',
                id,
                audioBuffer: buffer,
                sampleRate: sampleRate
            }, [buffer]);

        } catch (err) {
            console.warn('[TTS Worker] Synthesize error:', err);
            self.postMessage({ type: 'SYNTH_ERROR', id, error: err ? err.message : 'Synth failed' });
        }
    }
};
