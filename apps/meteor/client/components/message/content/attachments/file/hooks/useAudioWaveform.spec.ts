import { toPeaks } from './useAudioWaveform';

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
