import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useRouteParameter, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import React, { useEffect, useCallback } from 'react';

import { ContextualbarDialog } from '../../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../components/Page';
import { queryClient } from '../../../lib/queryClient';
import ContextualBarRouter from './ContextualBarRouter';
import CallTab from './calls/CallTab';
import ChatTab from './chats/ChatTab';
import ContactTab from './contacts/ContactTab';
import ContactGroupsTab from './groups/ContactGroupsTab';

const DEFAULT_TAB = 'contacts';

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

	const chatReload = () => queryClient.invalidateQueries({ queryKey: ['current-chats'] });

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Omnichannel_Contact_Center')} />
				<Tabs flexShrink={0}>
					<TabsItem selected={tab === 'contacts'} onClick={() => handleTabClick('contacts')}>
						{t('Contacts')}
					</TabsItem>
					<TabsItem selected={tab === 'chats'} onClick={() => handleTabClick('chats')}>
						{t('Chats' as any /* TODO: this is going to change to Conversations */)}
					</TabsItem>
					<TabsItem selected={tab === 'calls'} onClick={() => handleTabClick('calls')}>
						{t('Calls')}
					</TabsItem>
					<TabsItem selected={tab === 'groups'} onClick={() => handleTabClick('groups')}>
						{t('Groups')}
					</TabsItem>
				</Tabs>
				<PageContent>
					{tab === 'contacts' && <ContactTab />}
					{tab === 'chats' && <ChatTab />}
					{tab === 'calls' && <CallTab />}
					{tab === 'groups' && <ContactGroupsTab />}
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog>
					<ContextualBarRouter chatReload={chatReload} />
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default OmnichannelDirectoryPage;
