import type { ReactNode } from 'react';

import { Surface } from './Surface';

export type MessageSurfaceProps = {
	children?: ReactNode;
};

const MessageSurface = ({ children }: MessageSurfaceProps) => <Surface type='message'>{children}</Surface>;

export default MessageSurface;
