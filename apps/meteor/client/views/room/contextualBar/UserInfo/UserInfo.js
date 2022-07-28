import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import MarkdownText from '../../../../components/MarkdownText';
import UTCClock from '../../../../components/UTCClock';
import UserCard from '../../../../components/UserCard';
import VerticalBar from '../../../../components/VerticalBar';
import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import InfoPanel from '../../../InfoPanel';
import Avatar from './Avatar';

function UserInfo({
	username,
	bio,
	canViewAllInfo,
	email,
	verified,
	showRealNames,
	status,
	phone,
	customStatus,
	roles = [],
	lastLogin,
	createdAt,
	utcOffset,
	customFields = [],
	name,
	data,
	nickname,
	actions,
	...props
}) {
	const t = useTranslation();
	const timeAgo = useTimeAgo();
	const customFieldsToShowSetting = useSetting('Accounts_CustomFieldsToShowInUserInfo');
	let customFieldsToShowObj;
	try {
		customFieldsToShowObj = JSON.parse(customFieldsToShowSetting);
	} catch (error) {
		customFieldsToShowObj = undefined;
	}

	const customFieldsToShow = customFieldsToShowObj
		? Object.values(customFieldsToShowObj).map((value) => {
				const role = Object.values(value);
				const roleNameToShow = Object.keys(value);
				const customField = {};
				customField[roleNameToShow] = customFields[role];
				return customField;
		  })
		: [];

	return (
		<VerticalBar.ScrollableContent p='x24' {...props}>
			<InfoPanel>
				<InfoPanel.Avatar>
					<Avatar size={'x332'} username={username} etag={data?.avatarETag} />
				</InfoPanel.Avatar>

				{actions && <InfoPanel.Section>{actions}</InfoPanel.Section>}

				<InfoPanel.Section>
					<InfoPanel.Title icon={status} title={getUserDisplayName(name, username, !!showRealNames)} />

					{customStatus && (
						<InfoPanel.Text>
							<MarkdownText content={customStatus} parseEmoji={true} variant='inline' />
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
							<InfoPanel.Text>
								<UTCClock utcOffset={utcOffset} />
							</InfoPanel.Text>
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
							{' '}
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
							{' '}
							<InfoPanel.Label>{t('Email')}</InfoPanel.Label>
							<InfoPanel.Text display='flex' flexDirection='row' alignItems='center'>
								<Box is='a' withTruncatedText href={`mailto:${email}`}>
									{email}
								</Box>
								<Margins inline='x4'>
									{verified && <Tag variant='secondary'>{t('Verified')}</Tag>}
									{verified || <Tag disabled>{t('Not_verified')}</Tag>}
								</Margins>
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{customFieldsToShow.map((customField) =>
						Object.values(customField)[0] ? (
							<InfoPanel.Field key={Object.keys(customField)[0]}>
								<InfoPanel.Label>{t(Object.keys(customField)[0])}</InfoPanel.Label>
								<InfoPanel.Text>
									<MarkdownText content={Object.values(customField)[0]} variant='inline' />
								</InfoPanel.Text>
							</InfoPanel.Field>
						) : null,
					)}

					{createdAt && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Created_at')}</InfoPanel.Label>
							<InfoPanel.Text>{timeAgo(createdAt)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
				</InfoPanel.Section>
			</InfoPanel>
		</VerticalBar.ScrollableContent>
	);
}

export default memo(UserInfo);
