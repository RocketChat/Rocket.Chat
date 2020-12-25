import React, { useEffect, useCallback, useState } from 'react';
import { Tabs, Icon, Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import Page from '../../components/Page';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import ContactTab from './ContactTab';
import VerticalBar from '../../components/VerticalBar';
import { ContactNewEdit, ContactEditWithData } from './ContactForm';
import { ContactInfo } from './ContactInfo';
import ChatTab from './ChatTab';


const OmnichannelDirectoryPage = () => {
	const t = useTranslation();

	const defaultTab = 'contacts';

	const tab = useRouteParameter('tab');
	const directoryRoute = useRoute('omnichannel-directory');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleTabClick = useCallback((tab) => () => directoryRoute.push({ tab }), [directoryRoute]);

	const [contactReload, setContactReload] = useState();

	useEffect(() => {
		if (!tab) {
			return directoryRoute.replace({ tab: defaultTab });
		}
	}, [directoryRoute, tab, defaultTab]);

	const ContactContextualBar = useCallback(() => {
		if (!context) {
			return '';
		}
		const handleVerticalBarCloseButtonClick = () => {
			directoryRoute.push({});
		};

		return <VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{context === 'new' && <Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'><Icon name='user' size='x20' /> {t('New_Contact')}</Box>}
				{context === 'info' && <Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'><Icon name='user' size='x20' /> {t('Contact_Profile')}</Box>}
				{context === 'edit' && <Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'><Icon name='pencil' size='x20' /> {t('Edit_Contact_Profile')}</Box>}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>

			{context === 'new' && <ContactNewEdit reload={contactReload} close={handleVerticalBarCloseButtonClick} />}
			{context === 'info' && <ContactInfo reload={contactReload} id={id} />}
			{context === 'edit' && <ContactEditWithData id={id} reload={contactReload} close={handleVerticalBarCloseButtonClick} />}

		</VerticalBar>;
	}, [context, t, contactReload, directoryRoute, id]);

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
					|| (tab === 'chats' && <ChatTab />)
				}
			</Page.Content>
		</Page>
		<ContactContextualBar />
	</Page>;
};

OmnichannelDirectoryPage.displayName = 'DirectoryOmnichannelPage';
export default OmnichannelDirectoryPage;
