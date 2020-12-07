import React, { useEffect, useCallback, useState } from 'react';
import { Tabs, Icon, Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import Page from '../../components/basic/Page';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import ContactTab from './ContactTab';
import VerticalBar from '../../components/basic/VerticalBar';
import { ContactNew } from './ContactNew';


const OmnichannelDirectoryPage = () => {
	const t = useTranslation();

	const defaultTab = 'contacts';

	const tab = useRouteParameter('tab');
	const directoryRoute = useRoute('omnichannel-directory');
	const context = useRouteParameter('context');
	// const id = useRouteParameter('id');

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
				<Icon name='user' size='x20' />
				{context === 'info' && <Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>{t('Contact_Profile')}</Box>}
				{context === 'new' && <Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>{t('New_Contact')}</Box>}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>

			{context === 'new' && <ContactNew reload={contactReload} close={handleVerticalBarCloseButtonClick} />}

		</VerticalBar>;
	}, [context, t, contactReload, directoryRoute]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Omnichannel')} />
			<Tabs flexShrink={0} >
				<Tabs.Item selected={tab === 'contacts'} onClick={handleTabClick('contacts')}>{t('Contacts')}</Tabs.Item>
				<Tabs.Item selected={tab === 'chats'} onClick={handleTabClick('chats')}>{t('Chats')}</Tabs.Item>
			</Tabs>
			<Page.Content>
				{
					(tab === 'contacts' && <ContactTab setContactReload={setContactReload} />)
				}
			</Page.Content>
		</Page>
		<ContactContextualBar />
	</Page>;
};

OmnichannelDirectoryPage.displayName = 'DirectoryOmnichannelPage';
export default OmnichannelDirectoryPage;
