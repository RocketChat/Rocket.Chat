import { Box, Tag } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AbacManagedTagProps = {
	icon: ReactNode;
	children: ReactNode;
};

/**
 * The tag that marks a room as managed by attribute-based access control, on its own line above the description.
 */
const AbacManagedTag = ({ icon, children }: AbacManagedTagProps) => (
	<Box display='flex' marginBlockEnd='x16'>
		<Tag medium>
			<Box display='flex' alignItems='center'>
				{icon}
				<Box marginInlineStart='x4'>{children}</Box>
			</Box>
		</Tag>
	</Box>
);

export default AbacManagedTag;
