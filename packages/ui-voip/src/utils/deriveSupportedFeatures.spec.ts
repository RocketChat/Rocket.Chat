import { deriveSupportedFeatures } from './deriveSupportedFeatures';

describe('deriveSupportedFeatures', () => {
	it('keeps only the listed features on a cti call', () => {
		expect(deriveSupportedFeatures('cti', ['audio', 'hold', 'mute'])).toEqual(['audio', 'hold', 'mute']);
	});

	it('adds every control feature to a webrtc call', () => {
		expect(deriveSupportedFeatures('webrtc', ['audio', 'hold'])).toEqual(
			expect.arrayContaining(['audio', 'hold', 'mute', 'direct-message', 'device-picker']),
		);
	});

	it('does not add the dialpad to a webrtc call that does not list it', () => {
		expect(deriveSupportedFeatures('webrtc', ['audio'])).not.toContain('dialpad');
	});

	it('does not duplicate a control feature the call already lists', () => {
		const features = deriveSupportedFeatures('webrtc', ['mute']);

		expect(features.filter((feature) => feature === 'mute')).toHaveLength(1);
	});

	it('treats a call with no service yet like a webrtc call', () => {
		expect(deriveSupportedFeatures(null, [])).toEqual(expect.arrayContaining(['mute']));
	});
});
