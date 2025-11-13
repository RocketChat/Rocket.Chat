import { UserStatus } from '@rocket.chat/core-typings';
import { Avatar, Box, Icon, StatusBullet } from '@rocket.chat/fuselage';

import { Slot } from '../../useInfoSlots';

type InternalUserProps = {
	displayName: string;
	status?: UserStatus;
	avatarUrl?: string;
	callerId?: string | number;
	slots?: Slot[];
};

const getRemoteStatusText = (slots?: Slot[]) => {
	if (!slots?.length) {
		return undefined;
	}
	return slots.map((slot) => slot.text).join(', ');
};

const InternalUser = ({ displayName, avatarUrl, callerId, status, slots }: InternalUserProps) => {
	const remoteStatusText = getRemoteStatusText(slots);
	return (
		<Box display='flex' flexDirection='row' id='rcx-media-call-widget-caller-info'>
			<Box mie={8}>{avatarUrl ? <Avatar url={avatarUrl} size='x20' /> : <Icon name='user' size='x20' />}</Box>
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='center' fontScale='p2b' color='default'>
					{status && <StatusBullet status={status} size='small' />}
					<Box mis={4}>{displayName}</Box>
				</Box>
				{callerId && (
					<Box fontScale='c1' color='secondary-info'>
						{callerId}
						{remoteStatusText ? ` - ${remoteStatusText}` : undefined}
					</Box>
				)}
				{!callerId && remoteStatusText && (
					<Box fontScale='c1' color='secondary-info'>
						{remoteStatusText}
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default InternalUser;
