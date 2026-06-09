import type { UserStatus } from '@rocket.chat/core-typings';
import { Avatar, Box, Icon, StatusBullet } from '@rocket.chat/fuselage';

import type { Slot } from './useInfoSlots';

type InternalUserProps = {
	displayName: string;
	status?: UserStatus;
	avatarUrl?: string;
	callerId?: string | number;
	slots?: Slot[];
	remoteMuted?: boolean;
};

const getRemoteStatusText = (slots?: Slot[]) => {
	if (!slots?.length) {
		return undefined;
	}
	return slots.map((slot) => slot.text).join(', ');
};

const InternalUser = ({ displayName, avatarUrl, callerId, status, slots, remoteMuted }: InternalUserProps) => {
	const remoteStatusText = getRemoteStatusText(slots);
	return (
		<Box display='flex' flexDirection='row' id='rcx-media-call-widget-caller-info'>
			<Box mie={8}>{avatarUrl ? <Avatar url={avatarUrl} size='x20' /> : <Icon name='user' size='x20' />}</Box>
			<Box display='flex' flexDirection='column' flexGrow={1}>
				<Box display='flex' flexDirection='row' alignItems='center' fontScale='p2b' color='default' justifyContent='space-between'>
					<Box is='span' display='flex' flexDirection='row' alignItems='center'>
						{status && <StatusBullet status={status} size='small' />}
						<Box mis={4}>{displayName}</Box>
					</Box>
					{remoteMuted && <Icon name='mic-off' size='x16' color='danger' />}
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
