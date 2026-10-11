import { Divider } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const MessageComposerActionsDivider = ({ height = 'x20', ...props }: ComponentProps<typeof Divider>) => (
	<Divider vertical marginInline={4} borderColor='light' marginBlock={0} backgroundColor='selected' height={height} {...props} />
);

export default MessageComposerActionsDivider;
