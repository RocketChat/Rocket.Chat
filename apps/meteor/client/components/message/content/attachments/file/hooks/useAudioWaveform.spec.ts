/**
 * @jest-environment node
 */
import { readBodyUpTo, toPeaks } from './useAudioWaveform';

describe('toPeaks', () => {
	it('keeps the loudest absolute sample of each block, scaled to the loudest block', () => {
		const samples = new Float32Array([0.1, -0.2, 0.5, -1, 0.25, 0]);
		const [quiet, loud, mid] = toPeaks(samples, 3);
		expect(quiet).toBeCloseTo(0.2);
		expect(loud).toBe(1);
		expect(mid).toBeCloseTo(0.25);
	});

	it('returns no peaks when there are fewer samples than bars', () => {
		expect(toPeaks(new Float32Array([0.5]), 3)).toEqual([]);
	});

	it('keeps silence at zero', () => {
		expect(toPeaks(new Float32Array(4), 2)).toEqual([0, 0]);
	});
});

describe('readBodyUpTo', () => {
	const streamOf = (...chunks: number[]) =>
		new ReadableStream<Uint8Array>({
			start(controller) {
				chunks.forEach((size) => controller.enqueue(new Uint8Array(size)));
				controller.close();
			},
		});

	it('returns a body within the limit', async () => {
		const body = await readBodyUpTo(new Response(streamOf(3, 4)), 8);
		expect(body.byteLength).toBe(7);
	});

	it('rejects a declared length over the limit', async () => {
		const response = new Response(streamOf(1), { headers: { 'content-length': '9' } });
		await expect(readBodyUpTo(response, 8)).rejects.toThrow('too large');
	});

	it('rejects a body that grows past the limit without declaring its length', async () => {
		await expect(readBodyUpTo(new Response(streamOf(5, 5)), 8)).rejects.toThrow('too large');
	});
});
