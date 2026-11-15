import { GainAnalysis } from './GainAnalysis';
import { ReplayGain } from './ReplayGain';

const titleGainOfSine = (amplitude: number) => {
	const ga = new GainAnalysis();
	const rgData = new ReplayGain();
	const samples = Float32Array.from({ length: 44100 }, (_, i) => amplitude * Math.sin(i / 10));

	expect(ga.initGainAnalysis(rgData, 44100)).toBe(GainAnalysis.INIT_GAIN_ANALYSIS_OK);
	expect(ga.analyzeSamples(rgData, samples, 0, samples, 0, samples.length, 1)).toBe(GainAnalysis.GAIN_ANALYSIS_OK);
	return ga.getTitleGain(rgData);
};

test('analyzeSamples handles windows that are not a multiple of 8 samples', () => {
	const gain = titleGainOfSine(10000);

	expect(gain).not.toBe(GainAnalysis.GAIN_NOT_ENOUGH_SAMPLES);
	expect(titleGainOfSine(5000) - gain).toBeCloseTo(20 * Math.log10(2), 1);
});
