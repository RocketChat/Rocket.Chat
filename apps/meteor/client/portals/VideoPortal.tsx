import type { ReactNode } from 'react';
import { memo } from 'react';
import { createPortal } from 'react-dom';

const createVideoRoot = (): HTMLElement => {
	const id = 'video-root';
	const existing = document.getElementById(id);

	if (existing) return existing;

	const newOne = document.createElement('div');
	newOne.id = id;
	document.body.append(newOne);

	return newOne;
};

let portalRoot: HTMLElement | null = null;

type VideoPortalProps = {
	children?: ReactNode;
};

const VideoPortal = ({ children }: VideoPortalProps) => {
	if (!portalRoot) {
		portalRoot = createVideoRoot();
	}

	return createPortal(children, portalRoot);
};

export default memo(VideoPortal);
