import { Box, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { RouteName } from '@rocket.chat/ui-contexts';
import {
	useToastMessageDispatch,
	useRoute,
	useTranslation,
	useEndpoint,
	usePermission,
	useRouter,
	useRouteParameter,
} from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import { ContextualbarHeader, ContextualbarIcon, ContextualbarTitle, ContextualbarClose } from '../../../components/Contextualbar';
import GenericMenu from '../../../components/GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';
// import { UserStatus } from '../../../components/UserStatus';
// import { useIsCallReady } from '../../../contexts/CallContext';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { parseOutboundPhoneNumber } from '../../../lib/voip/parseOutboundPhoneNumber';
import ContactManagerInfo from '../../../omnichannel/ContactManagerInfo';
import { useRoomToolbox } from '../../room/contexts/RoomToolboxContext';
import AgentInfoDetails from '../components/AgentInfoDetails';
import CustomField from '../components/CustomField';
import Field from '../components/Field';
import Info from '../components/Info';
import Label from '../components/Label';
import { FormSkeleton } from '../directory/components/FormSkeleton';
import { useContactRoute } from '../hooks/useContactRoute';
import ContactInfoChannels from './tabs/ContactInfoChannels';
import ContactInfoDetails from './tabs/ContactInfoDetails';
import ContactInfoHistory from './tabs/ContactInfoHistory';

type ContactInfoProps = {
	id: string;
	onClose: () => void;
	rid?: string;
	route?: RouteName;
};

type ContactInfoTabs = 'details' | 'channels' | 'history' | 'edit';

const ContactInfo = ({ id: contactId, onClose, rid: roomId = '', route }: ContactInfoProps) => {
	const t = useTranslation();
	const [contactTab, setContactTab] = useState<ContactInfoTabs>('details');

	const liveRoute = useRoute('live');

	const { getRouteName } = useRouter();
	const currentRouteName = getRouteName();
	const handleNavigate = useContactRoute();

	const formatDate = useFormatDate();
	// const isCallReady = useIsCallReady();

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

	if (isInitialLoading) {
		return (
			<Box pi={24}>
				<FormSkeleton />
			</Box>
		);
	}

	if (isError || !contact) {
		return <Box mbs={16}>{t('Contact_not_found')}</Box>;
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
	const customFieldEntries = canViewCustomFields
		? Object.entries((livechatData ?? {}) as unknown as Record<string, string>).filter(
				([key, value]) => checkIsVisibleAndScopeVisitor(key) && value,
		  )
		: [];

	const editMenuItem: GenericMenuItemProps = {
		id: 'edit',
		icon: 'pencil',
		content: 'Edit',
		onClick: () => handleNavigate('edit'),
		disabled: !canEditContact,
	};

	const blockMenuItem: GenericMenuItemProps = {
		id: 'block',
		icon: 'ban',
		content: 'Block',
	};

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='info-circled' />
				<ContextualbarTitle>{t('Contact')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<Box display='flex' pi={24}>
				{username && (
					<Box width='100%' pb={16} display='flex' alignItems='center' justifyContent='space-between'>
						<Box display='flex'>
							<UserAvatar size='x40' title={username} username={username} />
							<Box mis={16} display='flex' flexDirection='column'>
								<Box fontScale='h4'>{username}</Box>
								{lastChat && <Box fontScale='c1'>{`${t('Last_Chat')}: ${formatDate(lastChat.ts)}`}</Box>}
							</Box>
						</Box>
						<GenericMenu title='test' detached items={[editMenuItem, blockMenuItem]} />
					</Box>
				)}
			</Box>
			<Tabs>
				<TabsItem onClick={() => setContactTab('details')} selected={contactTab === 'details'}>
					Details
				</TabsItem>
				<TabsItem onClick={() => setContactTab('channels')} selected={contactTab === 'channels'}>
					Channels
				</TabsItem>
				{showContactHistory && (
					<TabsItem onClick={() => setContactTab('history')} selected={contactTab === 'history'}>
						History
					</TabsItem>
				)}
			</Tabs>
			{contactTab === 'details' && <ContactInfoDetails phoneNumber={phoneNumber} email={email} customFieldEntries={customFieldEntries} />}
			{contactTab === 'channels' && <ContactInfoChannels />}
			{contactTab === 'history' && showContactHistory && <ContactInfoHistory />}
			{/* <Divider /> */}

			{/* {isCallReady && (
				<ButtonGroup stretch>
					<>
						<VoipInfoCallButton phoneNumber={phoneNumber} />
						{showContactHistory && <Divider width='100%' />}
					</>
				</ButtonGroup>
			)} */}
		</>
	);
};

export default ContactInfo;
