import { GainAnalysis } from './GainAnalysis';
import { ReplayGain } from './ReplayGain';

test('analyzeSamples handles windows that are not a multiple of 8 samples', () => {
	const ga = new GainAnalysis();
	const rgData = new ReplayGain();
	const samples = Float32Array.from({ length: 44100 }, (_, i) => 10000 * Math.sin(i / 10));

	expect(ga.initGainAnalysis(rgData, 44100)).toBe(GainAnalysis.INIT_GAIN_ANALYSIS_OK);
	expect(ga.analyzeSamples(rgData, samples, 0, samples, 0, samples.length, 1)).toBe(GainAnalysis.GAIN_ANALYSIS_OK);
	expect(Number.isFinite(ga.getTitleGain(rgData))).toBe(true);
});
