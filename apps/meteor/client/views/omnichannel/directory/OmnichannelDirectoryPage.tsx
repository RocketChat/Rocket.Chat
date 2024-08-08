import { Tabs } from '@rocket.chat/fuselage';
import { useRouteParameter, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import React, { useEffect, useCallback } from 'react';

import { ContextualbarDialog } from '../../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../components/Page';
import ContextualBarRouter from './ContextualBarRouter';
import CallTab from './calls/CallTab';
import ChatTab from './chats/ChatTab';
import ContactTab from './contacts/ContactTab';

const DEFAULT_TAB = 'chats';

const OmnichannelDirectoryPage = () => {
	const t = useTranslation();
	const router = useRouter();
	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				if (router.getRouteName() !== 'omnichannel-directory' || !!router.getRouteParameters().tab) {
					return;
				}

				router.navigate({
					name: 'omnichannel-directory',
					params: { tab: DEFAULT_TAB },
				});
			}),
		[router],
	);

	const handleTabClick = useCallback((tab) => router.navigate({ name: 'omnichannel-directory', params: { tab } }), [router]);

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Omnichannel_Contact_Center')} />
				<Tabs flexShrink={0}>
					<Tabs.Item selected={tab === 'chats'} onClick={() => handleTabClick('chats')}>
						{t('Chats')}
					</Tabs.Item>
					<Tabs.Item selected={tab === 'contacts'} onClick={() => handleTabClick('contacts')}>
						{t('Contacts')}
					</Tabs.Item>
					<Tabs.Item selected={tab === 'calls'} onClick={() => handleTabClick('calls')}>
						{t('Calls')}
					</Tabs.Item>
				</Tabs>
				<PageContent>
					{tab === 'chats' && <ChatTab />}
					{tab === 'contacts' && <ContactTab />}
					{tab === 'calls' && <CallTab />}
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog>
					<ContextualBarRouter />
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default OmnichannelDirectoryPage;
