import React, { useEffect, useCallback } from 'react';
import { Tabs } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import Page from '../../components/basic/Page';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import ContactTab from './ContactTab';


const OmnichannelDirectoryPage = () => {
	const t = useTranslation();

	const defaultTab = 'contacts';

	const tab = useRouteParameter('tab');
	const directoryRoute = useRoute('omnichannel-directory');
	const handleTabClick = useCallback((tab) => () => directoryRoute.push({ tab }), [directoryRoute]);

	useEffect(() => {
		if (!tab) {
			return directoryRoute.replace({ tab: defaultTab });
		}
	}, [directoryRoute, tab, defaultTab]);

	return <Page>
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
	</Page>;
};

OmnichannelDirectoryPage.displayName = 'DirectoryOmnichannelPage';
export default OmnichannelDirectoryPage;
