import { Box, Margins, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useCurrentRoute, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState } from 'react';

import { hasPermission } from '../../../../../../app/authorization/client';
import ContactManagerInfo from '../../../../../../ee/client/omnichannel/ContactManagerInfo';
import UserCard from '../../../../../components/UserCard/UserCard';
import { UserStatus } from '../../../../../components/UserStatus';
import VerticalBar from '../../../../../components/VerticalBar';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import CustomField from '../../../components/CustomField';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { FormSkeleton } from '../../Skeleton';

const ContactInfo = ({ id, rid, route }) => {
	const t = useTranslation();
	const routePath = useRoute(route || 'omnichannel-directory');

	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');

	const [customFields, setCustomFields] = useState([]);

	const formatDate = useFormatDate();

	const dispatchToastMessage = useToastMessageDispatch();

	const canViewCustomFields = () => hasPermission('view-livechat-room-customfields');

	const onEditButtonClick = useMutableCallback(() => {
		if (!hasPermission('edit-omnichannel-contact')) {
			return dispatchToastMessage({ type: 'error', message: t('Not_authorized') });
		}

		routePath.push(
			route
				? {
						tab: 'contact-profile',
						context: 'edit',
						id: rid,
				  }
				: {
						page: 'contacts',
						id,
						bar: 'edit',
				  },
		);
	});

	useEffect(() => {
		if (allCustomFields) {
			const { customFields: customFieldsAPI } = allCustomFields;
			setCustomFields(customFieldsAPI);
		}
	}, [allCustomFields, stateCustomFields]);

	const { value: data, phase: state, error } = useEndpointData(`omnichannel/contact?contactId=${id}`);

	const [currentRouteName] = useCurrentRoute();
	const liveRoute = useRoute('live');

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box pi='x24'>
				<FormSkeleton />
			</Box>
		);
	}

	if (error || !data || !data.contact) {
		return <Box mbs='x16'>{t('Contact_not_found')}</Box>;
	}

	const {
		contact: { name, username, visitorEmails, phone, livechatData, ts, lastChat, contactManager },
	} = data;

	const checkIsVisibleAndScopeVisitor = (key) => {
		const field = customFields.find(({ _id }) => _id === key);
		if (field && field.visibility === 'visible' && field.scope === 'visitor') {
			return true;
		}
		return false;
	};

	const onChatHistory = () => {
		const { _id } = lastChat;
		liveRoute.push({ id: _id, tab: 'contact-chat-history' });
	};

	const showContactHistory = currentRouteName === 'live';

	const displayName = name || username;

	return (
		<>
			<VerticalBar.ScrollableContent p='x24'>
				<Margins block='x4'>
					{displayName && (
						<Field>
							<Label>{`${t('Name')} / ${t('Username')}`}</Label>
							<Info style={{ display: 'flex' }}>
								<UserAvatar size='x40' title={username} username={username} />
								<UserCard.Username mis='x10' name={displayName} status={<UserStatus status={status} />} />
								{username && name && (
									<Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>
										({username})
									</Box>
								)}
							</Info>
						</Field>
					)}
					{visitorEmails && visitorEmails.length && (
						<Field>
							<Label>{t('Email')}</Label>
							<Info>{visitorEmails[0].address}</Info>
						</Field>
					)}
					{phone && phone.length && (
						<Field>
							<Label>{t('Phone')}</Label>
							<Info>{phone[0].phoneNumber}</Info>
						</Field>
					)}
					{ts && (
						<Field>
							<Label>{t('Created_at')}</Label>
							<Info>{formatDate(ts)}</Info>
						</Field>
					)}

					{lastChat && (
						<Field>
							<Label>{t('Last_Chat')}</Label>
							<Info>{formatDate(lastChat.ts)}</Info>
						</Field>
					)}
					{canViewCustomFields() &&
						livechatData &&
						Object.keys(livechatData).map(
							(key) =>
								checkIsVisibleAndScopeVisitor(key) && livechatData[key] && <CustomField key={key} id={key} value={livechatData[key]} />,
						)}
					{contactManager && (
						<Field>
							<Label>{t('Contact_Manager')}</Label>
							<ContactManagerInfo username={contactManager.username} />
						</Field>
					)}
				</Margins>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					{showContactHistory && lastChat && (
						<Button onClick={onChatHistory}>
							<Icon name='history' size='x20' /> {t('Chat_History')}
						</Button>
					)}
					<Button onClick={onEditButtonClick}>
						<Icon name='pencil' size='x20' /> {t('Edit')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default ContactInfo;
