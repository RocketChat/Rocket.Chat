import { Badge, Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { usePermission } from '@rocket.chat/ui-contexts';

import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';

export type AppRequestItemProps = {
	seen: boolean;
	name: string;
	createdDate: string;
	message: string;
	username: string;
};

const AppRequestItem = ({ seen, name, createdDate, message, username }: AppRequestItemProps) => {
	const formatDateAndTime = useFormatDateAndTime();
	const isAdminUser = usePermission('manage-apps');

	return (
		<Box display='flex' flexDirection='row' paddingBlock={12} paddingInlineEnd={24} marginBlockEnd={8} flexGrow='1'>
			<Box marginInlineEnd={8} marginBlockStart={2} display='flex' flexDirection='row' alignItems='flex-start' height='full'>
				<Box marginInlineEnd={16} alignSelf='center' height='100%' width='x8'>
					{!seen && isAdminUser && <Badge small variant='primary' />}
				</Box>
				{username && <UserAvatar size='x36' username={username} />}
			</Box>
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='flex-start' marginBlockEnd={4}>
					<Box fontScale='p2b' marginInlineEnd={4} lineHeight='initial' color='titles-labels'>
						{name}
					</Box>
					<Box fontScale='c1' color='annotation'>
						{formatDateAndTime(createdDate)}
					</Box>
				</Box>
				<Box fontScale='p2' color='default'>
					{message}
				</Box>
			</Box>
		</Box>
	);
};

export default AppRequestItem;
