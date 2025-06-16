import { Banner, Icon } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const MessageSurface = ({ children }: { children: ReactNode }) => (
  <Banner icon={<Icon name="info" size="x20" />}>{children}</Banner>
);

export default MessageSurface;
