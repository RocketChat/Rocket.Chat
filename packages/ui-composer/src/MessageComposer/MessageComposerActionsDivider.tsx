import { Divider } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposerActionsDivider = ({ height = 'x20', ...props }: ComponentProps<typeof Divider>): ReactElement => (
	<Divider mi='x4' borderColor='light' mb={0} backgroundColor='neutral-500' height={height} {...props} />
);

export default MessageComposerActionsDivider;
