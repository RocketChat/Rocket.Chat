import { Box } from '@rocket.chat/fuselage';
import type { FormEventHandler, ReactNode } from 'react';

export type MessageSearchFormLayoutProps = {
	onSubmit: FormEventHandler<HTMLElement>;
	children: ReactNode;
};

/**
 * The message search form, spanning the section's width, with its fields above the notices about the search.
 */
const MessageSearchFormLayout = (props: MessageSearchFormLayoutProps) => (
	<Box is='form' width='full' display='flex' flexDirection='column' gap='x12' {...props} />
);

export default MessageSearchFormLayout;
