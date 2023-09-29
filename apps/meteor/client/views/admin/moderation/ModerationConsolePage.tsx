import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useTranslation, useRouteParameter, useToastMessageDispatch, type TranslationKey } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState } from 'react';

import { Contextualbar } from '../../../components/Contextualbar';
import Page from '../../../components/Page';
import { getPermaLink } from '../../../lib/getPermaLink';
import ModerationConsoleTable from './ModerationConsoleTable';
import UserMessages from './UserMessages';
import ModConsoleUsersTable from './UserReports/ModConsoleUsersTable';

const tabs = ['Reported_Messages', 'Reported_Users'];

const ModerationConsolePage = () => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const dispatchToastMessage = useToastMessageDispatch();
	const [tab, setTab] = useState('Reported_Users');

	const handleRedirect = async (mid: string) => {
		try {
			const permalink = await getPermaLink(mid);
			// open the permalink in same tab
			window.open(permalink, '_self');
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleTabClick = useMemo(() => (tab: string) => (): void => setTab(tab), [setTab]);

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Moderation')} />
				<Page.Content>
					<Tabs>
						{tabs.map((tabName) => (
							<TabsItem key={tabName || ''} selected={tab === tabName} onClick={handleTabClick(tabName)}>
								{t(tabName as TranslationKey)}
							</TabsItem>
						))}
					</Tabs>
					{tab === 'Reported_Messages' && <ModerationConsoleTable />} {tab === 'Reported_Users' && <ModConsoleUsersTable />}
				</Page.Content>
			</Page>
			{context && <Contextualbar>{context === 'info' && id && <UserMessages userId={id} onRedirect={handleRedirect} />}</Contextualbar>}
		</Page>
	);
};

export default ModerationConsolePage;
