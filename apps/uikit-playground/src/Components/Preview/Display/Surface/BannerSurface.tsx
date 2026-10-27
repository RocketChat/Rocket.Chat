import { Banner, Icon } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type MessageSurfaceProps = { children: ReactNode };

const MessageSurface = ({ children }: MessageSurfaceProps) => <Banner icon={<Icon name='info' size='x20' />}>{children}</Banner>;

export default MessageSurface;
