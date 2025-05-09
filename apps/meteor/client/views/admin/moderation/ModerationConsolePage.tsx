import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useTranslation, useRouteParameter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import ModConsoleReportDetails from './ModConsoleReportDetails';
import ModerationConsoleTable from './ModerationConsoleTable';
import ModConsoleUsersTable from './UserReports/ModConsoleUsersTable';
import { Page, PageHeader, PageContent } from '../../../components/Page';
import { getPermaLink } from '../../../lib/getPermaLink';

type TabType = 'users' | 'messages';

type ModerationConsolePageProps = {
	tab: TabType;
	onSelectTab?: (tab: TabType) => void;
};

const ModerationConsolePage = ({ tab = 'messages', onSelectTab }: ModerationConsolePageProps) => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleRedirect = useCallback(
		async (mid: string) => {
			try {
				const permalink = await getPermaLink(mid);
				window.open(permalink, '_self');
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[dispatchToastMessage],
	);

	const handleTabClick = useCallback(
		(tab: TabType): undefined | (() => void) => (onSelectTab ? (): void => onSelectTab(tab) : undefined),
		[onSelectTab],
	);

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Moderation')} />
				<Tabs>
					<TabsItem selected={tab === 'messages'} onClick={handleTabClick('messages')}>
						{t('Reported_Messages')}
					</TabsItem>
					<TabsItem selected={tab === 'users'} onClick={handleTabClick('users')}>
						{t('Reported_Users')}
					</TabsItem>
				</Tabs>
				<PageContent>
					{tab === 'messages' && <ModerationConsoleTable />}
					{tab === 'users' && <ModConsoleUsersTable />}
				</PageContent>
			</Page>
			{context === 'info' && id && <ModConsoleReportDetails userId={id} onRedirect={handleRedirect} default={tab} />}
		</Page>
	);
};

export default ModerationConsolePage;
