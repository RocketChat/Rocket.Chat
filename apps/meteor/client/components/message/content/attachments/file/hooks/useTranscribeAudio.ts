import { useCallback, useState } from 'react';

import { useTranscription } from '../../../../../../providers/TranscriptionProvider';

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

type TranscribeStatus = 'idle' | 'loading-model' | 'transcribing' | 'done' | 'error';

export const useTranscribeAudio = () => {
	const { transcribe: contextTranscribe, modelLoaded, unloadModel, isSupported } = useTranscription();
	const [status, setStatus] = useState<TranscribeStatus>('idle');
	const [transcript, setTranscript] = useState<string | null>(null);
	const [progress, setProgress] = useState<string | null>(null);
	const [metrics, setMetrics] = useState<TranscribeMetrics | null>(null);

	const transcribe = useCallback(
		async (audioUrl: string, language?: string, modelId = 'onnx-community/whisper-small') => {
			if (!isSupported) return;

			setStatus('loading-model');
			setTranscript(null);
			setProgress(null);
			setMetrics(null);

			try {
				const result = await contextTranscribe(audioUrl, language, modelId, (info) => {
					setProgress(info);
				});

				setStatus('done');
				setTranscript(result.text);
				setMetrics(result.metrics);

				// Switch to transcribing once model is loaded (progress callback handles loading-model state)
				// The contextTranscribe handles everything — we just update local state
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
			}
		},
		[isSupported, contextTranscribe],
	);

	return { transcribe, unloadModel, modelLoaded, status, transcript, progress, metrics, isSupported };
};
