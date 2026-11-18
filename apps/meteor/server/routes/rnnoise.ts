import { resolveInstalledFile, serveFiles } from '../lib/http/serveFiles';

const fromPackage = (file: string) => () => resolveInstalledFile(`@sapphi-red/web-noise-suppressor/${file}`);

/** Serves RNNoise to the conference window from the installed package, so clients never fetch it from a third party. */
serveFiles(
	'/video-conference/rnnoise',
	new Map([
		['rnnoise-worklet.js', fromPackage('rnnoiseWorklet.js')],
		['rnnoise.wasm', fromPackage('rnnoise.wasm')],
		['rnnoise_simd.wasm', fromPackage('rnnoise_simd.wasm')],
	]),
);
