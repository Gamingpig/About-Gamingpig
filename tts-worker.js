/**
 * tts-worker.js - Standard-compatible Web Worker
 * Uses importScripts with UMD/IIFE bundle to support all mobile & desktop browsers.
 */

self.importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');

let ttsPipeline = null;
let isInitialized = false;
let initPromise = null;

const VOICE_MAP = {
    de: 'bm_fable',
    en: 'af_heart',
    es: 'bm_george',
    fr: 'bm_lewis',
    pt: 'bm_george',
    tr: 'bm_fable'
};

async function getPipeline() {
    if (isInitialized && ttsPipeline) return ttsPipeline;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        const { pipeline, env } = self.transformers || {};
        if (!pipeline) throw new Error('Transformers library failed to load in worker');

        if (env && env.backends && env.backends.onnx) {
            env.backends.onnx.wasm.numThreads = 1;
            env.backends.onnx.wasm.proxy = false;
        }

        ttsPipeline = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
            quantized: true
        });

        isInitialized = true;
        return ttsPipeline;
    })();

    return initPromise;
}

self.onmessage = async function(e) {
    const { type, text, lang, voice, id } = e.data || {};

    if (type === 'INIT') {
        try {
            await getPipeline();
            self.postMessage({ type: 'INIT_SUCCESS' });
        } catch (err) {
            console.warn('[TTS Worker] Init failed:', err);
            isInitialized = false;
            initPromise = null;
            self.postMessage({ type: 'INIT_ERROR', error: err ? err.message : 'Init error' });
        }
        return;
    }

    if (type === 'SYNTHESIZE') {
        try {
            const pipe = await getPipeline();
            // Xenova/speecht5_tts speaker embedding
            const speakerEmbeddings = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin';
            const output = await pipe(text, {
                speaker_embeddings: speakerEmbeddings
            });

            let float32 = null;
            let sampleRate = 16000;

            if (output && output.audio) {
                float32 = output.audio instanceof Float32Array ? output.audio : new Float32Array(output.audio);
                sampleRate = output.sampling_rate || 16000;
            }

            if (!float32 || float32.length === 0) {
                throw new Error('TTS audio array empty');
            }

            const buffer = float32.buffer;
            self.postMessage({
                type: 'SYNTH_SUCCESS',
                id,
                audioBuffer: buffer,
                sampleRate: sampleRate
            }, [buffer]);

        } catch (err) {
            console.warn('[TTS Worker] Synth error:', err);
            self.postMessage({ type: 'SYNTH_ERROR', id, error: err ? err.message : 'Synth failed' });
        }
    }
};
