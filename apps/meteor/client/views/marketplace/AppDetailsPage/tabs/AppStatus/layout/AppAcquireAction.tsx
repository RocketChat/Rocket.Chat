import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppAcquireActionProps = {
	hidden?: boolean;
	withPrice?: boolean;
	children: ReactNode;
};

/**
 * The button that installs, buys or requests an app, with its price beside it when `withPrice` is set.
 * `hidden` keeps its space while it is not shown.
 */
const AppAcquireAction = ({ hidden = false, withPrice = false, children }: AppAcquireActionProps) => (
	<Box
		display='flex'
		flexDirection='row'
		alignItems='center'
		justifyContent='center'
		borderRadius='medium'
		gap='x12'
		paddingInlineEnd={withPrice ? 'x4' : undefined}
		invisible={hidden}
	>
		{children}
	</Box>
);

export default AppAcquireAction;
