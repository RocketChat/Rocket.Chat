import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/ui-client';
import { useRolesDescription, useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LocalTime from '../../../components/LocalTime';
import { UserCard, UserCardRole } from '../../../components/UserCard';

export type CurrentUserDisplayProps = {
	user: IUser;
};

const CurrentUserDisplay = ({ user }: CurrentUserDisplayProps) => {
	const showRealNames = useSetting('UI_Use_Real_Name', false);
	const getRoles = useRolesDescription();

	const { t } = useTranslation();
	const { username, avatarETag, name, statusText, nickname, roles, utcOffset } = user;

	const data = useMemo(
		() => ({
			username,
			etag: avatarETag,
			name: showRealNames ? name : username,
			nickname,
			status: <UserStatus.Online />,
			customStatus: statusText ?? <></>,
			roles: roles && getRoles(roles).map((role, index) => <UserCardRole key={index}>{role}</UserCardRole>),
			localTime: utcOffset && Number.isInteger(utcOffset) && <LocalTime utcOffset={utcOffset} />,
		}),
		[avatarETag, getRoles, name, nickname, roles, showRealNames, statusText, username, utcOffset],
	);

	return (
		<>
			<p>{t('core.You_are_logged_in_as')}</p>
			<UserCard user={data} />
		</>
	);
};

export default CurrentUserDisplay;
