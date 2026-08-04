import type { DividerProps } from '@rocket.chat/fuselage';
import { Divider } from '@rocket.chat/fuselage';

const MessageComposerActionsDivider = ({ height = 'x20', ...props }: DividerProps) => (
	<Divider vertical marginInline={4} borderColor='light' marginBlock={0} backgroundColor='selected' height={height} {...props} />
);

export default MessageComposerActionsDivider;
