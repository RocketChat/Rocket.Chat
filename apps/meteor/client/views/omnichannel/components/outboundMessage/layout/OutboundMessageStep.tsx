import { Box, Scrollable } from '@rocket.chat/fuselage';
import type { FormEventHandler, ReactNode } from 'react';

export type OutboundMessageStepProps = {
	is?: 'div' | 'form';
	id?: string;
	onSubmit?: FormEventHandler<HTMLElement>;
	noValidate?: boolean;
	actions?: ReactNode;
	children: ReactNode;
};

/**
 * A step of the outbound message wizard: its content scrolls, and its actions stay below it.
 */
const OutboundMessageStep = ({ is = 'div', actions, children, ...props }: OutboundMessageStepProps) => (
	<Box is={is} display='flex' flexDirection='column' height='100%' flexGrow={1} flexShrink={0} {...props}>
		<Scrollable vertical>
			<Box>{children}</Box>
		</Scrollable>
		{actions}
	</Box>
);

export default OutboundMessageStep;
