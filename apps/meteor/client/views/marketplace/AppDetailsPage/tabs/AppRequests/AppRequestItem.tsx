import { Badge, Box } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';

type AppRequestItemProps = {
	seen: boolean;
	name: string;
	createdDate: string;
	message: string;
	username: string;
};

const AppRequestItem = ({ seen, name, createdDate, message, username }: AppRequestItemProps): ReactElement => {
	const formatDateAndTime = useFormatDateAndTime();
	const isAdminUser = usePermission('manage-apps');

	return (
		<Box display='flex' flexDirection='row' pb='x12' pie='x24' mbe='x8' flexGrow='1'>
			<Box mie='x8' mbs='x2' display='flex' flexDirection='row' alignItems='flex-start' h='full'>
				<Box mie='x16' alignSelf='center' height='100%' width='x8'>
					{!seen && isAdminUser && <Badge small variant='primary' />}
				</Box>
				{username && <UserAvatar size='x36' username={username} />}
			</Box>
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='flex-start' mbe='x4'>
					<Box fontScale='p2b' mie='x4' lineHeight='initial' color='titles-labels'>
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
