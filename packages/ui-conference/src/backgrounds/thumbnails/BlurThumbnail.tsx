import SampleScene from './SampleScene';
import type { BlurLevel } from '../../devices/BackgroundEffectContext';

/** Only the order matters here, not the camera's real radius. */
const SAMPLE_BLUR_PX: Record<BlurLevel, number> = { light: 2, medium: 4, strong: 8 };

export type BlurThumbnailProps = { level: BlurLevel };

const BlurThumbnail = ({ level }: BlurThumbnailProps) => <SampleScene blur={SAMPLE_BLUR_PX[level]} />;

export default BlurThumbnail;
