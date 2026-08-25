import type { IUser, Serialized } from '@rocket.chat/core-typings';
import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import {
	useUserDisplayName,
	ContextualbarScrollableContent,
	InfoPanel,
	InfoPanelActionGroup,
	InfoPanelField,
	InfoPanelLabel,
	InfoPanelSection,
	InfoPanelText,
} from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo, useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useTimeAgo } from '../../hooks/useTimeAgo';
import { useUserCustomFields } from '../../hooks/useUserCustomFields';
import MarkdownText from '../MarkdownText';
import UTCClock from '../UTCClock';
import { UserCardRoles, UserCardUsername } from '../UserCard';
import UserInfoABACAttributes from './UserInfoABACAttributes';
import UserInfoCopyableText from './UserInfoCopyableText';
import UserInfoZoomableAvatar from './UserInfoZoomableAvatar';

type UserInfoDataProps = Serialized<
	Pick<
		IUser,
		| 'name'
		| 'username'
		| 'nickname'
		| 'bio'
		| 'title'
		| 'nationality'
		| 'languages'
		| 'lastLogin'
		| 'avatarETag'
		| 'utcOffset'
		| 'phone'
		| 'createdAt'
		| 'canViewAllInfo'
		| 'customFields'
		| 'freeSwitchExtension'
		| 'abacAttributes'
	>
>;

export type UserInfoProps = UserInfoDataProps & {
	status: ReactNode;
	customStatus?: ReactNode;
	email?: string;
	verified?: boolean;
	actions: ReactNode;
	roles: ReactNode[];
	roomRoles?: ReactNode[];
	reason?: string;
	invitationDate?: string;
};

const UserInfo = ({
	username,
	name,
	lastLogin,
	nickname,
	bio,
	title,
	nationality,
	languages,
	avatarETag,
	roles,
	roomRoles,
	utcOffset,
	phone,
	email,
	verified,
	createdAt,
	status,
	customStatus,
	customFields,
	canViewAllInfo,
	actions,
	reason,
	freeSwitchExtension,
	abacAttributes,
	invitationDate,
	...props
}: UserInfoProps) => {
	const { t } = useTranslation();
	const timeAgo = useTimeAgo();
	const userDisplayName = useUserDisplayName({ name, username });
	const userCustomFields = useUserCustomFields(customFields);
	const usernameId = useId();

	const profileDetails = [
		{ label: t('Title'), text: title },
		{ label: t('Nationality'), text: nationality },
		{ label: t('Languages'), text: languages?.join(', ') },
	];

	return (
		<ContextualbarScrollableContent padding={24} {...props}>
			<InfoPanel>
				<InfoPanelSection display='flex' alignItems='center'>
					{username && <UserInfoZoomableAvatar username={username} etag={avatarETag} />}
					<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} marginInlineStart='x8' withTruncatedText>
						{userDisplayName && <UserCardUsername is='h2' flexGrow={0} flexBasis='auto' status={status} name={userDisplayName} />}
						{customStatus && (
							<Box color='hint' fontScale='p2' paddingInlineStart='x4' withTruncatedText>
								{customStatus}
							</Box>
						)}
					</Box>
				</InfoPanelSection>

				{actions && <InfoPanelActionGroup>{actions}</InfoPanelActionGroup>}

				<InfoPanelSection>
					{username && username !== name && (
						<InfoPanelField is='dl'>
							<InfoPanelLabel is='dt' id={usernameId}>
								{t('Username')}
							</InfoPanelLabel>
							<UserInfoCopyableText is='dd' aria-labelledby={usernameId} text={username} />
						</InfoPanelField>
					)}

					{reason && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Reason_for_joining')}</InfoPanelLabel>
							<UserInfoCopyableText text={reason} />
						</InfoPanelField>
					)}

					{nickname && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Nickname')}</InfoPanelLabel>
							<UserInfoCopyableText text={nickname} />
						</InfoPanelField>
					)}

					{profileDetails.map(
						({ label, text }) =>
							text && (
								<InfoPanelField key={label}>
									<InfoPanelLabel>{label}</InfoPanelLabel>
									<UserInfoCopyableText text={text} withTruncatedText={false} wordBreak='break-word' />
								</InfoPanelField>
							),
					)}

					{roles?.length !== 0 && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Workspace_roles')}</InfoPanelLabel>
							<UserCardRoles>{roles}</UserCardRoles>
						</InfoPanelField>
					)}

					{roomRoles && roomRoles.length !== 0 && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Room_roles')}</InfoPanelLabel>
							<UserCardRoles>{roomRoles}</UserCardRoles>
						</InfoPanelField>
					)}

					{utcOffset && Number.isInteger(utcOffset) && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Local_Time')}</InfoPanelLabel>
							<InfoPanelText>
								<UTCClock utcOffset={utcOffset} />
							</InfoPanelText>
						</InfoPanelField>
					)}

					{bio && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Bio')}</InfoPanelLabel>
							<UserInfoCopyableText text={bio} withTruncatedText={false}>
								<MarkdownText variant='inline' content={bio} />
							</UserInfoCopyableText>
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
							<UserInfoCopyableText text={phone}>
								<Box is='a' withTruncatedText href={`tel:${phone}`}>
									{phone}
								</Box>
							</UserInfoCopyableText>
						</InfoPanelField>
					)}

					{email && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Email')}</InfoPanelLabel>
							<UserInfoCopyableText text={email}>
								<Box is='a' withTruncatedText href={`mailto:${email}`}>
									{email}
								</Box>
								<Margins inline={4}>
									<Tag>{verified ? t('Verified') : t('Not_verified')}</Tag>
								</Margins>
							</UserInfoCopyableText>
						</InfoPanelField>
					)}

					{freeSwitchExtension && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Voice_call_extension')}</InfoPanelLabel>
							<UserInfoCopyableText text={freeSwitchExtension} />
						</InfoPanelField>
					)}

					{abacAttributes && abacAttributes.length > 0 && (
						<InfoPanelField>
							<InfoPanelLabel title={t('ABAC_Attributes_description')}>{t('ABAC_Attributes')}</InfoPanelLabel>
							<UserInfoABACAttributes abacAttributes={abacAttributes} />
						</InfoPanelField>
					)}
					{userCustomFields?.map(
						(customField) =>
							customField?.value && (
								<InfoPanelField key={customField.value}>
									<InfoPanelLabel>{t(customField.label as TranslationKey)}</InfoPanelLabel>
									<UserInfoCopyableText text={customField.value}>
										<MarkdownText content={customField.value} variant='inline' />
									</UserInfoCopyableText>
								</InfoPanelField>
							),
					)}

					{invitationDate && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Invitation_date')}</InfoPanelLabel>
							<InfoPanelText>{timeAgo(invitationDate)}</InfoPanelText>
						</InfoPanelField>
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
