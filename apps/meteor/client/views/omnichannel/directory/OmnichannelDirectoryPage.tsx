import { Tabs } from '@rocket.chat/fuselage';
import { useCurrentRoute, useRoute, useRouteParameter, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useCallback, useState } from 'react';

import Page from '../../../components/Page';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ContextualBar from './ContextualBar';
import CallTab from './calls/CallTab';
import ChatTab from './chats/ChatTab';
import ContactTab from './contacts/ContactTab';

const DEFAULT_TAB = 'contacts';

const OmnichannelDirectoryPage = (): ReactElement => {
	const [routeName] = useCurrentRoute();
	const tab = useRouteParameter('page');
	const directoryRoute = useRoute('omnichannel-directory');
	const canViewDirectory = usePermission('view-omnichannel-contact-center');

	useEffect(() => {
		if (routeName !== 'omnichannel-directory') {
			return;
		}

		if (!tab) {
			return directoryRoute.replace({ page: DEFAULT_TAB });
		}
	}, [routeName, directoryRoute, tab]);

	const handleTabClick = useCallback((tab) => (): void => directoryRoute.push({ tab }), [directoryRoute]);

	const [chatReload, setChatReload] = useState();

	const t = useTranslation();

	if (!canViewDirectory) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Omnichannel_Contact_Center')} />
				<Tabs flexShrink={0}>
					<Tabs.Item selected={tab === 'contacts'} onClick={handleTabClick('contacts')}>
						{t('Contacts')}
					</Tabs.Item>
					<Tabs.Item selected={tab === 'chats'} onClick={handleTabClick('chats')}>
						{t('Chats' as 'color')}
					</Tabs.Item>
					<Tabs.Item selected={tab === 'calls'} onClick={handleTabClick('calls')}>
						{t('Calls' as 'color')}
					</Tabs.Item>
				</Tabs>
				<Page.Content>
					{(tab === 'contacts' && <ContactTab />) ||
						(tab === 'chats' && <ChatTab setChatReload={setChatReload} />) ||
						(tab === 'calls' && <CallTab />)}
				</Page.Content>
			</Page>
			<ContextualBar chatReload={chatReload} />
		</Page>
	);
};

export default OmnichannelDirectoryPage;
