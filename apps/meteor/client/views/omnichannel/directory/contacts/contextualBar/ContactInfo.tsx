import { Box, Margins, ButtonGroup, Button, Icon, Divider } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { RouterPaths } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useCurrentRoute, useRoute, useTranslation, useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { parseOutboundPhoneNumber } from '../../../../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import ContactManagerInfo from '../../../../../../ee/client/omnichannel/ContactManagerInfo';
import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../../../components/Contextualbar';
import { UserStatus } from '../../../../../components/UserStatus';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useIsCallReady } from '../../../../../contexts/CallContext';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import AgentInfoDetails from '../../../components/AgentInfoDetails';
import CustomField from '../../../components/CustomField';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { VoipInfoCallButton } from '../../calls/contextualBar/VoipInfoCallButton';
import { FormSkeleton } from '../../components/FormSkeleton';

type ContactInfoProps = {
	id: string;
	rid?: string;
	route?: keyof RouterPaths;
};

const ContactInfo = ({ id: contactId, rid: roomId = '', route }: ContactInfoProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const routePath = useRoute(route || 'omnichannel-directory');
	const liveRoute = useRoute('live');
	const [currentRouteName] = useCurrentRoute();

	const formatDate = useFormatDate();
	const isCallReady = useIsCallReady();

	const canViewCustomFields = usePermission('view-livechat-room-customfields');
	const canEditContact = usePermission('edit-omnichannel-contact');

	const getCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');
	const { data: { customFields } = {} } = useQuery(['/v1/livechat/custom-fields'], () => getCustomFields());

	const getContact = useEndpoint('GET', '/v1/omnichannel/contact');
	const {
		data: { contact } = {},
		isInitialLoading,
		isError,
	} = useQuery(['/v1/omnichannel/contact', contactId], () => getContact({ contactId }), {
		enabled: canViewCustomFields && !!contactId,
	});

	const onEditButtonClick = useMutableCallback(() => {
		if (!canEditContact) {
			return dispatchToastMessage({ type: 'error', message: t('Not_authorized') });
		}

		routePath.push(
			route
				? {
						tab: 'contact-profile',
						context: 'edit',
						id: roomId,
				  }
				: {
						page: 'contacts',
						id: contactId,
						bar: 'edit',
				  },
		);
	});

	if (isInitialLoading) {
		return (
			<Box pi='x24'>
				<FormSkeleton />
			</Box>
		);
	}

	if (isError || !contact) {
		return <Box mbs='x16'>{t('Contact_not_found')}</Box>;
	}

	const { username, visitorEmails, phone, ts, livechatData, lastChat, contactManager, status } = contact;

	const showContactHistory = currentRouteName === 'live' && lastChat;

	const [{ phoneNumber = '' }] = phone ?? [{}];
	const [{ address: email = '' }] = visitorEmails ?? [{}];

	const checkIsVisibleAndScopeVisitor = (key: string) => {
		const field = customFields?.find(({ _id }) => _id === key);
		return field?.visibility === 'visible' && field?.scope === 'visitor';
	};

	const onChatHistory = () => {
		const { _id = '' } = lastChat ?? {};
		liveRoute.push({ id: _id, tab: 'contact-chat-history' });
	};

	// Serialized does not like unknown :(
	const customFieldEntries = Object.entries((livechatData ?? {}) as unknown as Record<string, string>).filter(
		([key, value]) => checkIsVisibleAndScopeVisitor(key) && value,
	);

	return (
		<>
			<ContextualbarScrollableContent p='x24'>
				<Margins block='x4'>
					{username && (
						<Field>
							<Label>{`${t('Name')} / ${t('Username')}`}</Label>
							<Info style={{ display: 'flex' }}>
								<UserAvatar size='x40' title={username} username={username} />
								<AgentInfoDetails mis='x10' name={username} shortName={username} status={<UserStatus status={status} />} />
							</Info>
						</Field>
					)}
					{email && (
						<Field>
							<Label>{t('Email')}</Label>
							<Info>{email}</Info>
						</Field>
					)}
					{phoneNumber && (
						<Field>
							<Label>{t('Phone')}</Label>
							<Info>{parseOutboundPhoneNumber(phoneNumber)}</Info>
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

					{canViewCustomFields &&
						customFieldEntries.map(([key, value]) => {
							return <CustomField key={key} id={key} value={value} />;
						})}

					{contactManager && (
						<Field>
							<Label>{t('Contact_Manager')}</Label>
							<ContactManagerInfo username={contactManager.username} />
						</Field>
					)}
				</Margins>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch flexWrap='wrap'>
					{isCallReady && (
						<>
							<VoipInfoCallButton phoneNumber={phoneNumber} mi={0} flexBasis='0' />
							{showContactHistory && <Divider width='100%' />}
						</>
					)}

					{showContactHistory && (
						<Button onClick={onChatHistory} mis={0} flexBasis='0'>
							<Icon name='history' size='x20' /> {t('Chat_History')}
						</Button>
					)}
					<Button onClick={onEditButtonClick} flexBasis='0'>
						<Icon name='pencil' size='x20' /> {t('Edit')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default ContactInfo;
