import path from 'node:path';

import { expect } from 'chai';
import { describe, it } from 'mocha';

import { resolveVideoConferenceAsset } from './resolveVideoConferenceAsset';

const roots = {
	mediapipe: '/pkgs/mediapipe',
	rnnoise: '/pkgs/rnnoise/dist',
	mediaProcessors: '/pkgs/media-processors',
};

describe('resolveVideoConferenceAsset', () => {
	it('serves the MediaPipe runtime from its package with the right content types', () => {
		expect(resolveVideoConferenceAsset(roots, 'mediapipe/vision_bundle.mjs')).to.deep.equal({
			filePath: path.resolve('/pkgs/mediapipe/vision_bundle.mjs'),
			contentType: 'text/javascript',
		});
		expect(resolveVideoConferenceAsset(roots, 'mediapipe/wasm/vision_wasm_internal.wasm')).to.deep.equal({
			filePath: path.resolve('/pkgs/mediapipe/wasm/vision_wasm_internal.wasm'),
			contentType: 'application/wasm',
		});
	});

	it('maps the RNNoise worklet name the processor asks for onto the file the package ships', () => {
		expect(resolveVideoConferenceAsset(roots, 'rnnoise/rnnoise-worklet.js')?.filePath).to.equal(
			path.resolve('/pkgs/rnnoise/dist/rnnoise/workletProcessor.js'),
		);
		expect(resolveVideoConferenceAsset(roots, 'rnnoise/rnnoise_simd.wasm')?.contentType).to.equal('application/wasm');
	});

	it('serves the blur worker from @rocket.chat/media-processors', () => {
		expect(resolveVideoConferenceAsset(roots, '/blur-worker.js')?.filePath).to.equal(
			path.resolve('/pkgs/media-processors/assets/background-blur-worker.js'),
		);
	});

	it('refuses anything that is not on the list', () => {
		expect(resolveVideoConferenceAsset(roots, 'mediapipe/package.json')).to.equal(undefined);
		expect(resolveVideoConferenceAsset(roots, 'mediapipe/vision_bundle.cjs')).to.equal(undefined);
		expect(resolveVideoConferenceAsset(roots, '/')).to.equal(undefined);
		expect(resolveVideoConferenceAsset(roots, '/constructor')).to.equal(undefined);
	});

	it('refuses path traversal', () => {
		expect(resolveVideoConferenceAsset(roots, '/../../../etc/passwd')).to.equal(undefined);
		expect(resolveVideoConferenceAsset(roots, 'mediapipe/../blur-worker.js')).to.equal(undefined);
		expect(resolveVideoConferenceAsset(roots, 'mediapipe/wasm/..\\..\\blur-worker.js')).to.equal(undefined);
	});
});
