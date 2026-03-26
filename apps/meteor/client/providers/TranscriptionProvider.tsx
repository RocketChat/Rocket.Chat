import { createContext, useContext, useMemo, useCallback, useRef, useState, type ReactNode } from 'react';

import type { TranscribeMetrics } from '../components/message/content/attachments/file/hooks/useTranscribeAudio';

type TranscriptionResult = {
	text: string;
	metrics: TranscribeMetrics;
};

type TranscriptionContextValue = {
	transcribe: (
		audioUrl: string,
		language: string | undefined,
		modelId: string,
		onProgress: (info: string) => void,
	) => Promise<TranscriptionResult>;
	modelLoaded: boolean;
	currentModelId: string | null;
	unloadModel: () => void;
	isSupported: boolean;
};

const TranscriptionContext = createContext<TranscriptionContextValue | undefined>(undefined);

const OFFLOAD_TIMEOUT_MS = 60_000;

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

export const TranscriptionProvider = ({ children }: { children: ReactNode }) => {
	const pipelineCacheRef = useRef<{ modelId: string; pipe: any } | null>(null);
	const pipelineLoadingRef = useRef<{ modelId: string; promise: Promise<any> } | null>(null);
	const gpuInfoRef = useRef<string | null>(null);
	const offloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [currentModelId, setCurrentModelId] = useState<string | null>(null);

	const disposePipeline = useCallback(() => {
		if (offloadTimerRef.current) {
			clearTimeout(offloadTimerRef.current);
			offloadTimerRef.current = null;
		}
		if (pipelineCacheRef.current) {
			try {
				pipelineCacheRef.current.pipe.dispose?.();
			} catch {}
			pipelineCacheRef.current = null;
		}
		setCurrentModelId(null);
	}, []);

	const scheduleOffload = useCallback(() => {
		if (offloadTimerRef.current) clearTimeout(offloadTimerRef.current);
		offloadTimerRef.current = setTimeout(disposePipeline, OFFLOAD_TIMEOUT_MS);
	}, [disposePipeline]);

	const loadLibrary = useCallback((): Promise<any> => {
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
	}, []);

	const getPipeline = useCallback(
		async (modelId: string, onProgress: (info: { file: string; progress: number }) => void): Promise<any> => {
			if (pipelineCacheRef.current && pipelineCacheRef.current.modelId === modelId) {
				return pipelineCacheRef.current.pipe;
			}

			if (pipelineLoadingRef.current && pipelineLoadingRef.current.modelId === modelId) {
				return pipelineLoadingRef.current.promise;
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
				pipelineCacheRef.current = { modelId, pipe };
				pipelineLoadingRef.current = null;
				setCurrentModelId(modelId);
				return pipe;
			})();

			promise.catch(() => {
				pipelineLoadingRef.current = null;
			});

			pipelineLoadingRef.current = { modelId, promise };
			return promise;
		},
		[loadLibrary],
	);

	const transcribe = useCallback(
		async (
			audioUrl: string,
			language: string | undefined,
			modelId: string,
			onProgress: (info: string) => void,
		): Promise<TranscriptionResult> => {
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

			const pipe = await getPipeline(modelId, ({ file, progress: pct }) => {
				const fileName = file ? file.split('/').pop() : '';
				onProgress(`${fileName} ${Math.round(pct)}%`);
			});

			const modelLoadTime = performance.now() - modelLoadStart;

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

			if (!gpuInfoRef.current) {
				gpuInfoRef.current = await getGpuInfo();
			}

			const text = Array.isArray(result) ? result.map((r: any) => r.text).join(' ') : result.text;

			scheduleOffload();

			return {
				text,
				metrics: {
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
					gpu: gpuInfoRef.current,
					deviceMemory: (navigator as any).deviceMemory || 0,
					cpuCores: navigator.hardwareConcurrency || 0,
				},
			};
		},
		[getPipeline, scheduleOffload],
	);

	const isSupported = typeof navigator !== 'undefined' && 'gpu' in navigator;

	const contextValue = useMemo<TranscriptionContextValue>(
		() => ({
			transcribe,
			modelLoaded: currentModelId !== null,
			currentModelId,
			unloadModel: disposePipeline,
			isSupported,
		}),
		[transcribe, currentModelId, disposePipeline, isSupported],
	);

	return <TranscriptionContext.Provider value={contextValue}>{children}</TranscriptionContext.Provider>;
};

export const useTranscription = (): TranscriptionContextValue => {
	const context = useContext(TranscriptionContext);
	if (!context) {
		throw new Error('useTranscription must be used within a TranscriptionProvider');
	}
	return context;
};
