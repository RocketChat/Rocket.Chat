import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type UserCardListItemProps = {
	icon?: ComponentProps<typeof Icon>['name'];
	children: ReactNode;
} & ComponentProps<typeof Box>;

const UserCardListItem = ({ icon, children, ...props }: UserCardListItemProps) => (
	<Box display='flex' alignItems='flex-start' fontScale='p2' color='default' marginBlock={2} {...props}>
		{icon ? <Icon name={icon} size='x20' flexShrink={0} /> : <Box width='x20' flexShrink={0} />}
		<Box flexGrow={1} flexShrink={1} width='1px' marginInlineStart={4}>
			{children}
		</Box>
	</Box>
);

export default UserCardListItem;
