import { Badge, Stack, Text } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useFormatDateAndTime } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import AppRequestRow from './layout/AppRequestRow';
import RequesterName from './layout/RequesterName';
import UnseenIndicatorSlot from './layout/UnseenIndicatorSlot';

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
		<AppRequestRow
			leading={
				<>
					<UnseenIndicatorSlot>{!seen && isAdminUser && <Badge small variant='primary' />}</UnseenIndicatorSlot>
					{username && <UserAvatar size='x36' username={username} />}
				</>
			}
		>
			<Stack direction='row' align='start' gap='x4'>
				<RequesterName>{name}</RequesterName>
				<Text fontScale='c1' color='annotation'>
					{formatDateAndTime(createdDate)}
				</Text>
			</Stack>
			<Text fontScale='p2' color='default'>
				{message}
			</Text>
		</AppRequestRow>
	);
};

export default AppRequestItem;
