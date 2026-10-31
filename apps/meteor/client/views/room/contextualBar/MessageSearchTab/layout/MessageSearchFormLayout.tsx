import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type MessageSearchFormLayoutProps = Pick<ComponentProps<'form'>, 'children' | 'onSubmit'>;

const MessageSearchFormLayout = ({ children, onSubmit }: MessageSearchFormLayoutProps) => (
	<Box is='form' onSubmit={onSubmit} width='full' display='flex' flexDirection='column' gap='x12'>
		{children}
	</Box>
);

export default MessageSearchFormLayout;
