import { Box, Callout, Tabs } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ContextualBarRouter from './ContextualBarRouter';
import ChatsTab from './chats/ChatsTab';
import ContactTab from './contacts/ContactTab';
import { useOmnichannelDirectoryRouter } from './hooks/useOmnichannelDirectoryRouter';
import ChatsProvider from './providers/ChatsProvider';
import { useIsOverMacLimit } from '../hooks/useIsOverMacLimit';

const OmnichannelDirectoryPage = () => {
	const { t } = useTranslation();
	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');

	const isWorkspaceOverMacLimit = useIsOverMacLimit();
	const omnichannelDirectoryRouter = useOmnichannelDirectoryRouter();

	useEffect(() => {
		if (!omnichannelDirectoryRouter.getRouteName() || (omnichannelDirectoryRouter.getRouteName() && !!tab)) {
			return;
		}

		omnichannelDirectoryRouter.navigate({ tab: 'chats' });
	}, [omnichannelDirectoryRouter, tab]);

	const handleTabClick = useCallback((tab: string) => omnichannelDirectoryRouter.navigate({ tab }), [omnichannelDirectoryRouter]);

	return (
		<ChatsProvider>
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
					</Tabs>
					<PageContent>
						{isWorkspaceOverMacLimit && (
							<Box mbs={16}>
								<Callout type='danger' icon='warning' title={t('The_workspace_has_exceeded_the_monthly_limit_of_active_contacts')}>
									{t('Talk_to_your_workspace_admin_to_address_this_issue')}
								</Callout>
							</Box>
						)}
						{tab === 'chats' && <ChatsTab />}
						{tab === 'contacts' && <ContactTab />}
					</PageContent>
				</Page>
				{context && <ContextualBarRouter />}
			</Page>
		</ChatsProvider>
	);
};

export default OmnichannelDirectoryPage;
