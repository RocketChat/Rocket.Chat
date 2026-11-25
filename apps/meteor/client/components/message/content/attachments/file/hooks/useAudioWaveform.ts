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

/** Stops the transfer of a body that will not be read. */
const discardBody = (response: Response) => {
	response.body?.cancel().catch(() => undefined);
};

/** Reads the whole body, failing as soon as it grows past `limit` bytes, whatever size the attachment declares. */
export const readBodyUpTo = async (response: Response, limit: number): Promise<ArrayBuffer> => {
	if (Number(response.headers.get('content-length')) > limit) {
		discardBody(response);
		throw new Error('Audio is too large for a waveform');
	}

	const reader = response.body?.getReader();
	if (!reader) {
		return new ArrayBuffer(0);
	}

	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		total += value.byteLength;
		if (total > limit) {
			reader.cancel().catch(() => undefined);
			throw new Error('Audio is too large for a waveform');
		}
		chunks.push(value);
	}

	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes.buffer;
};

const fetchPeaks = async (src: string, signal: AbortSignal) => {
	const response = await fetch(src, { credentials: 'same-origin', signal });
	if (!response.ok) {
		discardBody(response);
		throw new Error(`Failed to fetch audio: ${response.status}`);
	}
	const context = new OfflineAudioContext(1, 1, 44100);
	// TODO: Bound the decoded size of audio waveforms, not only the download
	// MAX_SIZE limits compressed bytes; a long low-bitrate clip under it decodes to hundreds of MiB of PCM.
	// Skipping clips over a duration limit (known from the attachment's metadata) would cap it.
	const buffer = await context.decodeAudioData(await readBodyUpTo(response, MAX_SIZE));
	return toPeaks(buffer.getChannelData(0), BAR_COUNT);
};

/** The waveform of a short audio file, or `undefined` while loading, when too large or when it can't be decoded. */
export const useAudioWaveform = (src: string, size?: number) =>
	useQuery({
		queryKey: ['audio-waveform', src],
		queryFn: ({ signal }) => fetchPeaks(src, signal),
		enabled: !!src && !!size && size <= MAX_SIZE,
		staleTime: Infinity,
		gcTime: Infinity,
		retry: false,
	}).data;
