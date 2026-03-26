import { useCallback, useState } from 'react';

type TranscribeStatus = 'idle' | 'loading-model' | 'transcribing' | 'done' | 'error';

export type TranscribeMetrics = {
	modelLoadTime: number;
	inferenceTime: number;
	audioDuration: number;
	realtimeFactor: number;
	modelId: string;
	language: string;
	audioSize: number;
	heapBefore: number;
	heapAfter: number;
	heapDelta: number;
	gpu: string;
	deviceMemory: number;
	cpuCores: number;
};

function getHeapMB(): number {
	const mem = (performance as any).memory;
	return mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : 0;
}

async function getGpuInfo(): Promise<string> {
	try {
		if (!navigator.gpu) return 'N/A';
		const adapter = await navigator.gpu.requestAdapter();
		if (!adapter) return 'No adapter';
		const info = (adapter as any).info || {};
		return [info.vendor, info.architecture, info.description].filter(Boolean).join(' ') || 'WebGPU';
	} catch {
		return 'WebGPU';
	}
}

const OFFLOAD_TIMEOUT_MS = 60_000;

let pipelineCache: { modelId: string; pipe: any } | null = null;
let pipelineLoading: { modelId: string; promise: Promise<any> } | null = null;
let gpuInfoCache: string | null = null;
let offloadTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleOffload() {
	if (offloadTimer) clearTimeout(offloadTimer);
	offloadTimer = setTimeout(() => {
		disposePipeline();
	}, OFFLOAD_TIMEOUT_MS);
}

function disposePipeline() {
	if (offloadTimer) {
		clearTimeout(offloadTimer);
		offloadTimer = null;
	}
	if (pipelineCache) {
		try {
			pipelineCache.pipe.dispose?.();
		} catch {}
		pipelineCache = null;
	}
}

function loadLibrary(): Promise<any> {
	return new Promise((resolve, reject) => {
		const w = window as any;
		if (w.HFTransformers) {
			resolve(w.HFTransformers);
			return;
		}
		const script = document.createElement('script');
		script.type = 'module';
		script.src = '/hf/loader.mjs';
		window.addEventListener('hf-loaded', () => resolve(w.HFTransformers), { once: true });
		script.onerror = () => reject(new Error('Failed to load transcription library'));
		document.head.appendChild(script);
	});
}

function getTranscriber(modelId: string, onProgress: (info: { file: string; progress: number }) => void): Promise<any> {
	if (pipelineCache && pipelineCache.modelId === modelId) {
		return Promise.resolve(pipelineCache.pipe);
	}

	if (pipelineLoading && pipelineLoading.modelId === modelId) {
		return pipelineLoading.promise;
	}

	const promise = (async () => {
		const { pipeline } = await loadLibrary();
		const pipe = await pipeline('automatic-speech-recognition', modelId, {
			device: 'webgpu',
			progress_callback: (p: any) => {
				if (p.status === 'progress') {
					onProgress({ file: p.file || '', progress: typeof p.progress === 'number' ? p.progress : 0 });
				} else if (p.status === 'initiate') {
					onProgress({ file: p.file || '', progress: 0 });
				}
			},
		});
		pipelineCache = { modelId, pipe };
		pipelineLoading = null;
		return pipe;
	})();

	promise.catch(() => {
		pipelineLoading = null;
	});

	pipelineLoading = { modelId, promise };
	return promise;
}

export const useTranscribeAudio = () => {
	const [status, setStatus] = useState<TranscribeStatus>('idle');
	const [transcript, setTranscript] = useState<string | null>(null);
	const [progress, setProgress] = useState<string | null>(null);
	const [metrics, setMetrics] = useState<TranscribeMetrics | null>(null);

	const isSupported = typeof navigator !== 'undefined' && 'gpu' in navigator;

	const transcribe = useCallback(async (audioUrl: string, language?: string, modelId = 'onnx-community/whisper-small') => {
		if (!isSupported) return;

		setStatus('loading-model');
		setTranscript(null);
		setProgress(null);
		setMetrics(null);

		try {
			// Pre-flight checks
			const deviceMem = (navigator as any).deviceMemory || 8;
			const minMemory = modelId.includes('small') ? 4 : 2;
			if (deviceMem < minMemory) {
				throw new Error(`Insufficient memory (${deviceMem} GB). Model requires at least ${minMemory} GB.`);
			}

			const adapter = await navigator.gpu?.requestAdapter();
			if (!adapter) {
				throw new Error('No WebGPU adapter available. A compatible GPU is required.');
			}

			const device = await adapter.requestDevice().catch(() => null);
			if (!device) {
				throw new Error('Failed to initialize WebGPU device.');
			}
			device.destroy();

			const modelLoadStart = performance.now();

			const pipe = await getTranscriber(modelId, ({ file, progress: pct }) => {
				const fileName = file ? file.split('/').pop() : '';
				setProgress(`${fileName} ${Math.round(pct)}%`);
			});

			const modelLoadTime = performance.now() - modelLoadStart;

			setStatus('transcribing');
			setProgress(null);

			const response = await fetch(audioUrl);
			const arrayBuffer = await response.arrayBuffer();
			const audioSize = arrayBuffer.byteLength;
			const audioContext = new AudioContext({ sampleRate: 16000 });
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
			const audioDuration = audioBuffer.duration;
			const audioData = audioBuffer.getChannelData(0);

			const options: Record<string, string> = { task: 'transcribe' };
			if (language) {
				options.language = language;
			}

			const heapBefore = getHeapMB();
			const inferenceStart = performance.now();
			const result = await pipe(audioData, options);
			const inferenceTime = performance.now() - inferenceStart;
			const heapAfter = getHeapMB();

			if (!gpuInfoCache) {
				gpuInfoCache = await getGpuInfo();
			}

			const text = Array.isArray(result) ? result.map((r: any) => r.text).join(' ') : result.text;

			setStatus('done');
			setTranscript(text);
			scheduleOffload();

			setMetrics({
				modelLoadTime: Math.round(modelLoadTime),
				inferenceTime: Math.round(inferenceTime),
				audioDuration: Math.round(audioDuration * 10) / 10,
				realtimeFactor: Math.round((audioDuration / (inferenceTime / 1000)) * 10) / 10,
				modelId,
				language: language || 'auto',
				audioSize,
				heapBefore,
				heapAfter,
				heapDelta: heapAfter - heapBefore,
				gpu: gpuInfoCache,
				deviceMemory: (navigator as any).deviceMemory || 0,
				cpuCores: navigator.hardwareConcurrency || 0,
			});
		} catch (err) {
			setStatus('error');
			const msg = err instanceof Error ? err.message : String(err);
			const isOOM = /out of memory|allocation failed|buffer size/i.test(msg);
			const isGPU = /webgpu|gpu|device lost/i.test(msg);
			if (isOOM && modelId.includes('small')) {
				setTranscript(`${msg}\n\nTry using the Tiny model instead — it requires less memory.`);
			} else if (isGPU) {
				setTranscript(`GPU error: ${msg}\n\nYour GPU may not support this operation. Try a smaller model.`);
			} else {
				setTranscript(msg);
			}
			// Dispose pipeline on error so next attempt starts fresh
			if (pipelineCache?.modelId === modelId) {
				disposePipeline();
			}
		}
	}, [isSupported]);

	const unloadModel = useCallback(() => {
		disposePipeline();
	}, []);

	const modelLoaded = pipelineCache !== null;

	return { transcribe, unloadModel, modelLoaded, status, transcript, progress, metrics, isSupported };
};
