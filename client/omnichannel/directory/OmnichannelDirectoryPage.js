import React, { useEffect, useCallback, useState } from 'react';
import { Tabs, Icon, Box } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { useTranslation } from '../../contexts/TranslationContext';
import Page from '../../components/Page';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import ContactTab from '../contacts/ContactTab';
import VerticalBar from '../../components/VerticalBar';
import { ContactNewEdit, ContactEditWithData } from '../contacts/contextualBar/ContactForm';
import { ContactInfo } from '../contacts/contextualBar/ContactInfo';
import ChatTab from '../chats/ChatTab';
import { ChatInfo } from '../chats/contextualBar/ChatInfo';
import { RoomEditWithData } from '../chats/contextualBar/ChatRoomEdit';


const OmnichannelDirectoryPage = () => {
	const t = useTranslation();

	const defaultTab = 'contacts';

	const tab = useRouteParameter('tab');
	const directoryRoute = useRoute('omnichannel-directory');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleTabClick = useCallback((tab) => () => directoryRoute.push({ tab }), [directoryRoute]);

	const [contactReload, setContactReload] = useState();
	const [chatReload, setChatReload] = useState();

	const handleContactsVerticalBarCloseButtonClick = () => {
		directoryRoute.push({});
	};

	const handleChatsVerticalBarCloseButtonClick = () => {
		directoryRoute.push({ tab: 'chats' });
	};

	useEffect(() => {
		if (!tab) {
			return directoryRoute.replace({ tab: defaultTab });
		}
	}, [directoryRoute, tab, defaultTab]);

	const openInRoom = () => {
		FlowRouter.go('live', { id });
	};

	const ContactContextualBar = () => <VerticalBar className={'contextual-bar'}>
		<VerticalBar.Header>
			{context === 'new' && <Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'><Icon name='user' size='x20' /> {t('New_Contact')}</Box>}
			{context === 'info' && <Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'><Icon name='user' size='x20' /> {t('Contact_Info')}</Box>}
			{context === 'edit' && <Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'><Icon name='pencil' size='x20' /> {t('Edit_Contact_Profile')}</Box>}
			<VerticalBar.Close onClick={handleContactsVerticalBarCloseButtonClick} />
		</VerticalBar.Header>
		{context === 'new' && <ContactNewEdit reload={contactReload} close={handleContactsVerticalBarCloseButtonClick} />}
		{context === 'info' && <ContactInfo reload={contactReload} id={id} />}
		{context === 'edit' && <ContactEditWithData id={id} reload={contactReload} close={handleContactsVerticalBarCloseButtonClick} />}
	</VerticalBar>;

	const ChatsContextualBar = () => <VerticalBar className={'contextual-bar'}>
		<VerticalBar.Header>
			{context === 'info'
			&& <>
				<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'><Icon name='info-circled' size='x20' /> {t('Room_Info')}</Box>
				<VerticalBar.Action title={t('View_full_conversation')} name={'new-window'} onClick={openInRoom} />
			</> }
			{context === 'edit' && <Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'><Icon name='pencil' size='x20' /> {t('edit-room')}</Box>}
			<VerticalBar.Close onClick={handleChatsVerticalBarCloseButtonClick} />
		</VerticalBar.Header>
		{context === 'info' && <ChatInfo id={id} />}
		{context === 'edit' && <RoomEditWithData id={id} close={handleChatsVerticalBarCloseButtonClick} reload={chatReload} />}
	</VerticalBar>;

	const ContextualBar = () => {
		if (!context) {
			return '';
		}

		switch (tab) {
			case 'contacts':
				return <ContactContextualBar />;
			case 'chats':
				return <ChatsContextualBar />;
			default:
				return '';
		}
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Omnichannel_Contact_Center')}/>
			<Tabs flexShrink={0} >
				<Tabs.Item selected={tab === 'contacts'} onClick={handleTabClick('contacts')}>{t('Contacts')}</Tabs.Item>
				<Tabs.Item selected={tab === 'chats'} onClick={handleTabClick('chats')}>{t('Chats')}</Tabs.Item>
			</Tabs>
			<Page.Content>
				{
					(tab === 'contacts' && <ContactTab setContactReload={setContactReload} />)
					|| (tab === 'chats' && <ChatTab setChatReload={setChatReload} />)
				}
			</Page.Content>
		</Page>
		<ContextualBar />
	</Page>;
};

OmnichannelDirectoryPage.displayName = 'DirectoryOmnichannelPage';
export default OmnichannelDirectoryPage;
