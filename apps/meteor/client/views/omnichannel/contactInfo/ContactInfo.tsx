import { Box, IconButton, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { RouteName } from '@rocket.chat/ui-contexts';
import { useTranslation, useEndpoint, usePermission, useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { ContextualbarHeader, ContextualbarIcon, ContextualbarTitle, ContextualbarClose } from '../../../components/Contextualbar';
import { useFormatDate } from '../../../hooks/useFormatDate';
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

const ContactInfo = ({ id: contactId, onClose }: ContactInfoProps) => {
	const t = useTranslation();

	const { getRouteName } = useRouter();
	const currentRouteName = getRouteName();
	const handleNavigate = useContactRoute();
	const context = useRouteParameter('context');

	const formatDate = useFormatDate();

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

	const { username, visitorEmails, phone, ts, livechatData, lastChat, contactManager } = contact;

	const showContactHistory = (currentRouteName === 'live' || currentRouteName === 'omnichannel-directory') && lastChat;

	const [{ phoneNumber = '' }] = phone ?? [{}];
	const [{ address: email = '' }] = visitorEmails ?? [{}];

	const checkIsVisibleAndScopeVisitor = (key: string) => {
		const field = customFields?.find(({ _id }) => _id === key);
		return field?.visibility === 'visible' && field?.scope === 'visitor';
	};

	// Serialized does not like unknown :(
	const customFieldEntries = canViewCustomFields
		? Object.entries((livechatData ?? {}) as unknown as Record<string, string>).filter(
				([key, value]) => checkIsVisibleAndScopeVisitor(key) && value,
		  )
		: [];

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
						<IconButton
							disabled={!canEditContact}
							title={canEditContact ? t('Edit') : t('Not_authorized')}
							small
							icon='pencil'
							onClick={() => handleNavigate({ context: 'edit' })}
						/>
					</Box>
				)}
			</Box>
			<Tabs>
				<TabsItem onClick={() => handleNavigate({ context: 'details' })} selected={context === 'details'}>
					{t('Details')}
				</TabsItem>
				<TabsItem onClick={() => handleNavigate({ context: 'channels' })} selected={context === 'channels'}>
					{t('Channels')}
				</TabsItem>
				{showContactHistory && (
					<TabsItem onClick={() => handleNavigate({ context: 'history' })} selected={context === 'history'}>
						{t('History')}
					</TabsItem>
				)}
			</Tabs>
			{context === 'details' && (
				<ContactInfoDetails
					ts={ts}
					contactManager={contactManager}
					phoneNumber={phoneNumber}
					email={email}
					customFieldEntries={customFieldEntries}
				/>
			)}
			{context === 'channels' && <ContactInfoChannels />}
			{context === 'history' && showContactHistory && <ContactInfoHistory />}
		</>
	);
};

export default ContactInfo;
