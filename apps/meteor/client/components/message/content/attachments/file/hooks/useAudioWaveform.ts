import { useQuery } from '@tanstack/react-query';

const BAR_COUNT = 40;

// Decoding means downloading the whole file, so only short clips such as voice messages get a waveform.
const MAX_SIZE = 2 * 1024 * 1024;

/** Reduces samples to `count` peaks, scaled so the loudest is 1. */
export const toPeaks = (samples: Float32Array, count: number): number[] => {
	const block = Math.floor(samples.length / count);
	if (!block) {
		return [];
	}

	const peaks = Array.from({ length: count }, (_, bar) => {
		let peak = 0;
		for (let i = bar * block; i < (bar + 1) * block; i++) {
			peak = Math.max(peak, Math.abs(samples[i]));
		}
		return peak;
	});

	const loudest = Math.max(...peaks);
	return loudest ? peaks.map((peak) => peak / loudest) : peaks;
};

const fetchPeaks = async (src: string) => {
	const response = await fetch(src, { credentials: 'same-origin' });
	if (!response.ok) {
		throw new Error(`Failed to fetch audio: ${response.status}`);
	}
	const context = new OfflineAudioContext(1, 1, 44100);
	const buffer = await context.decodeAudioData(await response.arrayBuffer());
	return toPeaks(buffer.getChannelData(0), BAR_COUNT);
};

/** The waveform of a short audio file, or `undefined` while loading, when too large or when it can't be decoded. */
export const useAudioWaveform = (src: string, size?: number) =>
	useQuery({
		queryKey: ['audio-waveform', src],
		queryFn: () => fetchPeaks(src),
		enabled: !!src && !!size && size <= MAX_SIZE,
		staleTime: Infinity,
		gcTime: Infinity,
		retry: false,
	}).data;
