import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppDetailsHeaderLayoutProps = {
	avatar: ReactNode;
	spread?: boolean;
	children: ReactNode;
};

/**
 * The top of an app's details page: the app's avatar, and its name, status and metadata in a column beside it.
 * `spread` stretches that column across the row and spaces its lines over the avatar's height, as the loading placeholder does.
 */
const AppDetailsHeaderLayout = ({ avatar, spread = false, children }: AppDetailsHeaderLayoutProps) => (
	<Box display='flex' flexDirection='row' marginBlockEnd='x20' width='full'>
		<Box marginInlineEnd='x32'>{avatar}</Box>
		<Box display='flex' flexDirection='column' justifyContent={spread ? 'space-between' : undefined} flexGrow={spread ? 1 : undefined}>
			{children}
		</Box>
	</Box>
);

export default AppDetailsHeaderLayout;
