import { Divider } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposerActionsDivider = ({ height = 'x20', ...props }: ComponentProps<typeof Divider>): ReactElement => (
	<Divider vertical mi='x4' borderColor='light' mb={0} backgroundColor='selected' height={height} {...props} />
);

export default MessageComposerActionsDivider;
