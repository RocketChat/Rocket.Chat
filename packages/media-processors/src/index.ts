export type { MediaProcessorAssets } from './assets';
export type { BackgroundBlurPerformance, BackgroundBlurProcessor, SegmenterModelKey } from './backgroundBlurProcessor';
export { supportsBackgroundBlur } from './backgroundBlurSupport';
export { RnnoiseProcessor } from './rnnoiseProcessor';
export type { VirtualBackgroundSnapshot } from './virtualBackground';
export {
	activateVirtualBackground,
	deactivateVirtualBackground,
	getVirtualBackgroundSnapshot,
	selectVirtualBackground,
	subscribeVirtualBackground,
} from './virtualBackground';

/** The blur processor and its WebGL compositor are only fetched once someone asks for blur. */
export const loadBackgroundBlurProcessor = async () => (await import('./backgroundBlurProcessor')).BackgroundBlurProcessor;
