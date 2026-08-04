import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

export type OutboundMessageFormProps = BoxProps & {
	onSubmit?: () => void;
};

const OutboundMessageForm = ({ onSubmit, ...props }: OutboundMessageFormProps) => (
	<Box is='form' display='flex' flexDirection='column' height='100%' flexGrow={1} flexShrink={0} onSubmit={onSubmit} {...props} />
);

export default OutboundMessageForm;
