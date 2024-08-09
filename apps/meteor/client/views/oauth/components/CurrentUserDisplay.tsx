import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { UserStatus } from '@rocket.chat/ui-client';
import { useRolesDescription, useSetting } from '@rocket.chat/ui-contexts';
import React from 'react';
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
	const showRealNames = useSetting<boolean>('UI_Use_Real_Name');
	const getRoles = useRolesDescription();

	const { t } = useTranslation();

	return (
		<>
			<p>{t('core.You_are_logged_in_as')}</p>
			<UserCard
				username={user.username}
				etag={user.avatarETag}
				name={showRealNames ? user.name : user.username}
				nickname={user.nickname}
				status={<UserStatus.Online />}
				customStatus={user.statusText ?? <></>}
				roles={user.roles && getRoles(user.roles).map((role, index) => <UserCardRole key={index}>{role}</UserCardRole>)}
				localTime={user.utcOffset && Number.isInteger(user.utcOffset) && <LocalTime utcOffset={user.utcOffset} />}
				bio={
					user.bio ? (
						<UserCardInfo withTruncatedText={false} className={clampStyle} height='x60'>
							{typeof user.bio === 'string' ? <MarkdownText variant='inline' content={user.bio} /> : user.bio}
						</UserCardInfo>
					) : (
						<></>
					)
				}
			/>
		</>
	);
};

export default CurrentUserDisplay;
