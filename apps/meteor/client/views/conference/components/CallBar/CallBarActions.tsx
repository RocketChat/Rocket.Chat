import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CallBarActionsProps = {
	/**
	 * `center` (default) holds the primary call controls. `end` is pulled out of the flow and anchored to
	 * the inline end, so adding or removing actions there never shifts the centred group.
	 */
	placement?: 'center' | 'end';
	children: ReactNode;
};

const CallBarActions = ({ placement = 'center', children }: CallBarActionsProps) => (
	<Box display='flex' alignItems='center' {...(placement === 'end' && { position: 'absolute', insetInlineEnd: 12 })}>
		<ButtonGroup>{children}</ButtonGroup>
	</Box>
);

export default CallBarActions;
