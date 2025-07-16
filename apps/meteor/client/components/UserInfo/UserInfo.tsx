import type { IUser, Serialized } from '@rocket.chat/core-typings';
import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useTimeAgo } from '../../hooks/useTimeAgo';
import { useUserCustomFields } from '../../hooks/useUserCustomFields';
import { ContextualbarScrollableContent } from '../Contextualbar';
import {
	InfoPanel,
	InfoPanelActionGroup,
	InfoPanelAvatar,
	InfoPanelField,
	InfoPanelLabel,
	InfoPanelSection,
	InfoPanelText,
	InfoPanelTitle,
} from '../InfoPanel';
import MarkdownText from '../MarkdownText';
import UTCClock from '../UTCClock';
import { UserCardRoles } from '../UserCard';
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
	reason?: string;
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
	reason,
	...props
}: UserInfoProps): ReactElement => {
	const { t } = useTranslation();
	const timeAgo = useTimeAgo();
	const userDisplayName = useUserDisplayName({ name, username });
	const userCustomFields = useUserCustomFields(customFields);

	return (
		<ContextualbarScrollableContent p={24} {...props}>
			<InfoPanel>
				{username && (
					<InfoPanelAvatar>
						<UserInfoAvatar username={username} etag={avatarETag} />
					</InfoPanelAvatar>
				)}

				{actions && <InfoPanelActionGroup>{actions}</InfoPanelActionGroup>}

				<InfoPanelSection>
					{userDisplayName && <InfoPanelTitle icon={status} title={userDisplayName} />}

					{statusText && (
						<InfoPanelText>
							<MarkdownText content={statusText} parseEmoji={true} variant='inline' />
						</InfoPanelText>
					)}
				</InfoPanelSection>

				<InfoPanelSection>
					{reason && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Reason_for_joining')}</InfoPanelLabel>
							<InfoPanelText>{reason}</InfoPanelText>
						</InfoPanelField>
					)}

					{nickname && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Nickname')}</InfoPanelLabel>
							<InfoPanelText>{nickname}</InfoPanelText>
						</InfoPanelField>
					)}

					{roles.length !== 0 && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Roles')}</InfoPanelLabel>
							<UserCardRoles>{roles}</UserCardRoles>
						</InfoPanelField>
					)}

					{username && username !== name && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Username')}</InfoPanelLabel>
							<InfoPanelText data-qa='UserInfoUserName'>{username}</InfoPanelText>
						</InfoPanelField>
					)}

					{Number.isInteger(utcOffset) && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Local_Time')}</InfoPanelLabel>
							<InfoPanelText>{utcOffset && <UTCClock utcOffset={utcOffset} />}</InfoPanelText>
						</InfoPanelField>
					)}

					{bio && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Bio')}</InfoPanelLabel>
							<InfoPanelText withTruncatedText={false}>
								<MarkdownText variant='inline' content={bio} />
							</InfoPanelText>
						</InfoPanelField>
					)}

					{Number.isInteger(utcOffset) && canViewAllInfo && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Last_login')}</InfoPanelLabel>
							<InfoPanelText>{lastLogin ? timeAgo(lastLogin) : t('Never')}</InfoPanelText>
						</InfoPanelField>
					)}

					{phone && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Phone')}</InfoPanelLabel>
							<InfoPanelText display='flex' flexDirection='row' alignItems='center'>
								<Box is='a' withTruncatedText href={`tel:${phone}`}>
									{phone}
								</Box>
							</InfoPanelText>
						</InfoPanelField>
					)}

					{email && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Email')}</InfoPanelLabel>
							<InfoPanelText display='flex' flexDirection='row' alignItems='center'>
								<Box is='a' withTruncatedText href={`mailto:${email}`}>
									{email}
								</Box>
								<Margins inline={4}>
									<Tag>{verified ? t('Verified') : t('Not_verified')}</Tag>
								</Margins>
							</InfoPanelText>
						</InfoPanelField>
					)}

					{userCustomFields?.map(
						(customField) =>
							customField?.value && (
								<InfoPanelField key={customField.value}>
									<InfoPanelLabel>{t(customField.label as TranslationKey)}</InfoPanelLabel>
									<InfoPanelText>
										<MarkdownText content={customField.value} variant='inline' />
									</InfoPanelText>
								</InfoPanelField>
							),
					)}

					{createdAt && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Created_at')}</InfoPanelLabel>
							<InfoPanelText>{timeAgo(createdAt)}</InfoPanelText>
						</InfoPanelField>
					)}
				</InfoPanelSection>
			</InfoPanel>
		</ContextualbarScrollableContent>
	);
};

export default memo(UserInfo);
