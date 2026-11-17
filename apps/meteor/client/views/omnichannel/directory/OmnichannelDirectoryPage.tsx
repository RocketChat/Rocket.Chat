import { Box, Callout } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import ContextualBarRouter from './ContextualBarRouter';
import ChatsTab from './chats/ChatsTab';
import ContactTab from './contacts/ContactTab';
import { useOmnichannelDirectoryRouter } from './hooks/useOmnichannelDirectoryRouter';
import ChatsProvider from './providers/ChatsProvider';
import { PageTabs } from '../../../components/PageTabs';
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

	return (
		<ChatsProvider>
			<Page flexDirection='row'>
				<Page>
					<PageHeader title={t('Omnichannel_Contact_Center')} />
					<PageTabs<string>
						items={[
							{ id: 'chats', label: t('Chats') },
							{ id: 'contacts', label: t('Contacts') },
						]}
						selected={tab}
						onSelect={(tab) => omnichannelDirectoryRouter.navigate({ tab })}
					/>
					<PageContent>
						{isWorkspaceOverMacLimit && (
							<Box marginBlockStart={16}>
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
