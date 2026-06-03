import { Margins } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import { Surface } from './Surface';

type MessageSurfaceProps = {
	children?: ReactNode;
};

const MessageSurface = ({ children }: MessageSurfaceProps) => (
	<Surface type='message'>
		<Margins blockEnd={16}>{children}</Margins>
	</Surface>
);

export default MessageSurface;
