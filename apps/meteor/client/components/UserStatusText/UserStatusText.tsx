import { UserStatus } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { isTruthy } from '@rocket.chat/tools';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useExpirationText } from '../../hooks/useExpirationText';
import MarkdownText from '../MarkdownText';

const STATUS_LABEL_KEYS: Record<UserStatus, string> = {
	[UserStatus.ONLINE]: 'Online',
	[UserStatus.AWAY]: 'Away',
	[UserStatus.BUSY]: 'Busy',
	[UserStatus.OFFLINE]: 'Offline',
	[UserStatus.DISABLED]: 'Disabled',
};

type UserStatusTextProps = {
	status?: UserStatus;
	statusText?: string;
	statusExpiresAt?: Date | string;
};

const UserStatusText = ({ status, statusText, statusExpiresAt }: UserStatusTextProps): ReactElement | null => {
	const { t } = useTranslation();
	const expirationText = useExpirationText(statusExpiresAt);

	const statusLabel = status ? t(STATUS_LABEL_KEYS[status] ?? STATUS_LABEL_KEYS[UserStatus.OFFLINE]) : undefined;
	const headline = [statusLabel, statusText].filter(isTruthy).join(' - ');

	if (!headline && !expirationText) {
		return null;
	}

	return (
		<>
			{headline && <MarkdownText content={headline} parseEmoji={true} variant='inline' />}
			{expirationText && (
				<Box color='secondary-info' display='flex' alignItems='center'>
					<Icon name='clock' size='x16' mie={4} />
					{expirationText}
				</Box>
			)}
		</>
	);
};

export default UserStatusText;
