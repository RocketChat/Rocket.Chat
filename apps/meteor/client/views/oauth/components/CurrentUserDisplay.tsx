import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { UserStatus } from '@rocket.chat/ui-client';
import { useRolesDescription, useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LocalTime from '../../../components/LocalTime';
import MarkdownText from '../../../components/MarkdownText';
import { UserCard, UserCardInfo, UserCardRole } from '../../../components/UserCard';

const clampStyle = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	word-break: break-all;
`;

type CurrentUserDisplayProps = {
	user: IUser;
};

const CurrentUserDisplay = ({ user }: CurrentUserDisplayProps) => {
	const showRealNames = useSetting('UI_Use_Real_Name', false);
	const getRoles = useRolesDescription();

	const { t } = useTranslation();
	const { username, avatarETag, name, statusText, nickname, roles, utcOffset, bio } = user;

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
			bio: bio ? (
				<UserCardInfo withTruncatedText={false} className={clampStyle} height='x60'>
					{typeof bio === 'string' ? <MarkdownText variant='inline' content={bio} /> : bio}
				</UserCardInfo>
			) : (
				<></>
			),
		}),
		[avatarETag, bio, getRoles, name, nickname, roles, showRealNames, statusText, username, utcOffset],
	);

	return (
		<>
			<p>{t('core.You_are_logged_in_as')}</p>
			<UserCard user={data} />
		</>
	);
};

export default CurrentUserDisplay;
