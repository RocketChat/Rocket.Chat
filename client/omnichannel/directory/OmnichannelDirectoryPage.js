import React, { useEffect, useCallback } from 'react';
import { Tabs } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import Page from '../../components/basic/Page';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import ContactTab from './ContactTab';
import VerticalBar from '../../components/basic/VerticalBar';


const OmnichannelDirectoryPage = () => {
	const t = useTranslation();

	const defaultTab = 'contacts';

	const tab = useRouteParameter('tab');
	const directoryRoute = useRoute('omnichannel-directory');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleTabClick = useCallback((tab) => () => directoryRoute.push({ tab }), [directoryRoute]);

	useEffect(() => {
		if (!tab) {
			return directoryRoute.replace({ tab: defaultTab });
		}
	}, [directoryRoute, tab, defaultTab]);

	const ContactProfile = useCallback(() => {
		if (!context) {
			return '';
		}
		const handleVerticalBarCloseButtonClick = () => {
			directoryRoute.push({});
		};

		return <VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{context === 'info' && t('Contact_Profile')}
				{context === 'new' && t('New_Contact')}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>

			<h1>{id}</h1>

		</VerticalBar>;
	}, [context, id, t, directoryRoute]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Omnichannel')} />
			<Tabs flexShrink={0} >
				<Tabs.Item selected={tab === 'contacts'} onClick={handleTabClick('contacts')}>{t('Contacts')}</Tabs.Item>
				<Tabs.Item selected={tab === 'chats'} onClick={handleTabClick('chats')}>{t('Chats')}</Tabs.Item>
			</Tabs>
			<Page.Content>
				{
					(tab === 'contacts' && <ContactTab />)
				}
			</Page.Content>
		</Page>
		<ContactProfile />
	</Page>;
};

OmnichannelDirectoryPage.displayName = 'DirectoryOmnichannelPage';
export default OmnichannelDirectoryPage;
