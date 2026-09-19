import { UserStatus as Status } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import type { ManagedPresenceUser } from './useManagedPresenceUsers';
import { UserStatus } from '../../../components/UserStatus';

export type UserPresenceTabRowProps = {
	user: ManagedPresenceUser;
	onClick: (user: ManagedPresenceUser) => void;
};

const UserPresenceTabRow = ({ user, onClick }: UserPresenceTabRowProps) => {
	const { t } = useTranslation();
	const { _id, username, name, status, presenceDisabledByAdmin, statusVisibilityDeniedByAdmin } = user;

	const handleClick = () => onClick(user);

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	};

	return (
		<GenericTableRow key={_id} action tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
			<GenericTableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					<UserAvatar size='x28' username={username ?? ''} />
					<Box display='flex' alignItems='center' marginInline={8} withTruncatedText>
						<Box marginInlineEnd={8}>
							<UserStatus status={presenceDisabledByAdmin ? Status.OFFLINE : status || Status.OFFLINE} />
						</Box>
						<Box fontScale='p2' withTruncatedText color='default'>
							{name || username}
						</Box>
					</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{presenceDisabledByAdmin ? t('Hidden') : t('Visible')}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				{presenceDisabledByAdmin ? t('Everyone') : statusVisibilityDeniedByAdmin.join(', ')}
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default UserPresenceTabRow;
