import type { ReactElement, ReactNode } from 'react';
import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { createAnchor } from '../lib/utils/createAnchor';
import { deleteAnchor } from '../lib/utils/deleteAnchor';

type VideoConfPortalProps = {
	children?: ReactNode;
};

const VideoConfPortal = ({ children }: VideoConfPortalProps): ReactElement => {
	const [videoConfRoot] = useState(() => createAnchor('video-conf-root'));
	useEffect(() => (): void => deleteAnchor(videoConfRoot), [videoConfRoot]);
	return createPortal(children, videoConfRoot);
};

export default memo(VideoConfPortal);
