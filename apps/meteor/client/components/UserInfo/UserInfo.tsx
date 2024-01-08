import type { IUser, Serialized } from '@rocket.chat/core-typings';
import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { memo } from 'react';

import { useTimeAgo } from '../../hooks/useTimeAgo';
import { useUserCustomFields } from '../../hooks/useUserCustomFields';
import { useUserDisplayName } from '../../hooks/useUserDisplayName';
import { ContextualbarScrollableContent } from '../Contextualbar';
import InfoPanel from '../InfoPanel';
import MarkdownText from '../MarkdownText';
import UTCClock from '../UTCClock';
import UserCard from '../UserCard';
import UserInfoAvatar from './UserInfoAvatar';

type UserInfoDataProps = Serialized<
	Pick<
		IUser,
		| 'name'
		| 'username'
		| 'nickname'
		| 'bio'
		| 'lastLogin'
		| 'avatarETag'
		| 'utcOffset'
		| 'phone'
		| 'createdAt'
		| 'statusText'
		| 'canViewAllInfo'
		| 'customFields'
	>
>;

type UserInfoProps = UserInfoDataProps & {
	status: ReactNode;
	email?: string;
	verified?: boolean;
	actions: ReactElement;
	roles: ReactElement[];
};

const UserInfo = ({
	username,
	name,
	lastLogin,
	nickname,
	bio,
	avatarETag,
	roles,
	utcOffset,
	phone,
	email,
	verified,
	createdAt,
	status,
	statusText,
	customFields,
	canViewAllInfo,
	actions,
	...props
}: UserInfoProps): ReactElement => {
	const t = useTranslation();
	const timeAgo = useTimeAgo();
	const userDisplayName = useUserDisplayName({ name, username });
	const userCustomFields = useUserCustomFields(customFields);

	return (
		<ContextualbarScrollableContent p={24} {...props}>
			<InfoPanel>
				{username && (
					<InfoPanel.Avatar>
						<UserInfoAvatar username={username} etag={avatarETag} />
					</InfoPanel.Avatar>
				)}

				{actions && <InfoPanel.Section>{actions}</InfoPanel.Section>}

				<InfoPanel.Section>
					{userDisplayName && <InfoPanel.Title icon={status} title={userDisplayName} />}
					{statusText && (
						<InfoPanel.Text>
							<MarkdownText content={statusText} parseEmoji={true} />
						</InfoPanel.Text>
					)}
				</InfoPanel.Section>

				<InfoPanel.Section>
					{roles.length !== 0 && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Roles')}</InfoPanel.Label>
							<UserCard.Roles>{roles}</UserCard.Roles>
						</InfoPanel.Field>
					)}

					{Number.isInteger(utcOffset) && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Local_Time')}</InfoPanel.Label>
							<InfoPanel.Text>{utcOffset && <UTCClock utcOffset={utcOffset} />}</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{username && username !== name && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Username')}</InfoPanel.Label>
							<InfoPanel.Text data-qa='UserInfoUserName'>{username}</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{canViewAllInfo && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Last_login')}</InfoPanel.Label>
							<InfoPanel.Text>{lastLogin ? timeAgo(lastLogin) : t('Never')}</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{name && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Full_Name')}</InfoPanel.Label>
							<InfoPanel.Text>{name}</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{nickname && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Nickname')}</InfoPanel.Label>
							<InfoPanel.Text>{nickname}</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{bio && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Bio')}</InfoPanel.Label>
							<InfoPanel.Text withTruncatedText={false}>
								<MarkdownText variant='inline' content={bio} />
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{phone && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Phone')}</InfoPanel.Label>
							<InfoPanel.Text display='flex' flexDirection='row' alignItems='center'>
								<Box is='a' withTruncatedText href={`tel:${phone}`}>
									{phone}
								</Box>
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{email && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Email')}</InfoPanel.Label>
							<InfoPanel.Text display='flex' flexDirection='row' alignItems='center'>
								<Box is='a' withTruncatedText href={`mailto:${email}`}>
									{email}
								</Box>
								<Margins inline={4}>
									<Tag>{verified ? t('Verified') : t('Not_verified')}</Tag>
								</Margins>
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{userCustomFields?.map(
						(customField) =>
							customField?.value && (
								<InfoPanel.Field key={customField.value}>
									<InfoPanel.Label>{t(customField.label as TranslationKey)}</InfoPanel.Label>
									<InfoPanel.Text>
										<MarkdownText content={customField.value} variant='inline' />
									</InfoPanel.Text>
								</InfoPanel.Field>
							),
					)}

					{createdAt && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Created_at')}</InfoPanel.Label>
							<InfoPanel.Text>{timeAgo(createdAt)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
				</InfoPanel.Section>
			</InfoPanel>
		</ContextualbarScrollableContent>
	);
};

export default memo(UserInfo);
