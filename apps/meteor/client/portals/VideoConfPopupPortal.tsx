import { AnchorPortal } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import { memo } from 'react';

const videoConfAnchorId = 'video-conf-root';

type VideoConfPortalProps = {
	children?: ReactNode;
};

const VideoConfPortal = ({ children }: VideoConfPortalProps): ReactElement => {
	return <AnchorPortal id={videoConfAnchorId}>{children}</AnchorPortal>;
};

export default memo(VideoConfPortal);
