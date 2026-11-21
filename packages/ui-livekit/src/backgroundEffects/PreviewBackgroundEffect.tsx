import { BackgroundEffectProvider } from '@rocket.chat/ui-conference';
import type { ReactNode } from 'react';

import { useBackgroundEffect } from './useBackgroundEffect';
import type { PreviewVideo } from '../usePreviewVideoTrack';

type PreviewBackgroundEffectProps = { preview: PreviewVideo; baseUrl: string; children: ReactNode };

const PreviewBackgroundEffect = ({ preview, baseUrl, children }: PreviewBackgroundEffectProps) => {
	const { selection } = useBackgroundEffect({ track: preview.track, baseUrl });

	return <BackgroundEffectProvider value={selection}>{children}</BackgroundEffectProvider>;
};

export default PreviewBackgroundEffect;
