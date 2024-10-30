import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Callout, IconButton, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation, useEndpoint, usePermission, useRouter, useRouteParameter, useSetModal } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { ContextualbarHeader, ContextualbarIcon, ContextualbarTitle, ContextualbarClose } from '../../../../components/Contextualbar';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useContactRoute } from '../../hooks/useContactRoute';
import ContactInfoChannels from '../tabs/ContactInfoChannels/ContactInfoChannels';
import ContactInfoDetails from '../tabs/ContactInfoDetails';
import ContactInfoHistory from '../tabs/ContactInfoHistory';
import ReviewContactModal from './ReviewContactModal';

type ContactInfoProps = {
	contact: Serialized<ILivechatContact>;
	onClose: () => void;
};

const ContactInfo = ({ contact, onClose }: ContactInfoProps) => {
	const t = useTranslation();

	const { getRouteName } = useRouter();
	const setModal = useSetModal();
	const currentRouteName = getRouteName();
	const handleNavigate = useContactRoute();
	const context = useRouteParameter('context');

	const formatDate = useFormatDate();

	const canViewCustomFields = usePermission('view-livechat-room-customfields');
	const canEditContact = usePermission('edit-omnichannel-contact');

	const getCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');
	const { data: { customFields } = {} } = useQuery(['/v1/livechat/custom-fields'], () => getCustomFields());

	const { name, emails, phones, conflictingFields, createdAt, lastChat, contactManager, customFields: userCustomFields } = contact;

	const hasConflicts = conflictingFields && conflictingFields?.length > 0;
	const showContactHistory = (currentRouteName === 'live' || currentRouteName === 'omnichannel-directory') && lastChat;

	const checkIsVisibleAndScopeVisitor = (key: string) => {
		const field = customFields?.find(({ _id }) => _id === key);
		return field?.visibility === 'visible' && field?.scope === 'visitor';
	};

	// Serialized does not like unknown :(
	const customFieldEntries = canViewCustomFields
		? Object.entries((userCustomFields ?? {}) as unknown as Record<string, string>).filter(
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
			<Box display='flex' flexDirection='column' pi={24}>
				{name && (
					<Box width='100%' pb={16} display='flex' alignItems='center' justifyContent='space-between'>
						<Box withTruncatedText display='flex'>
							<UserAvatar size='x40' title={name} username={name} />
							<Box withTruncatedText mis={16} display='flex' flexDirection='column'>
								<Box withTruncatedText fontScale='h4'>
									{name}
								</Box>
								{lastChat && <Box fontScale='c1'>{`${t('Last_Chat')}: ${formatDate(lastChat.ts)}`}</Box>}
							</Box>
						</Box>
						<IconButton
							disabled={!canEditContact || hasConflicts}
							title={canEditContact ? t('Edit') : t('Not_authorized')}
							small
							icon='pencil'
							onClick={() => handleNavigate({ context: 'edit' })}
						/>
					</Box>
				)}
				{hasConflicts && (
					<Callout
						mbe={8}
						alignItems='center'
						icon='members'
						actions={
							<ButtonGroup>
								<Button onClick={() => setModal(<ReviewContactModal onCancel={() => setModal(null)} contact={contact} />)} small>
									{t('See_conflicts')}
								</Button>
							</ButtonGroup>
						}
						title={t('Conflicts_found', { conflicts: conflictingFields?.length })}
					/>
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
					createdAt={createdAt}
					contactManager={contactManager}
					phones={phones?.map(({ phoneNumber }) => phoneNumber)}
					emails={emails?.map(({ address }) => address)}
					customFieldEntries={customFieldEntries}
				/>
			)}
			{context === 'channels' && <ContactInfoChannels channels={contact?.channels} />}
			{context === 'history' && showContactHistory && <ContactInfoHistory contactId={contact._id} />}
		</>
	);
};

export default ContactInfo;
