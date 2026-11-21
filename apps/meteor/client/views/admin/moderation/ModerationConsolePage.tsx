import { escapeRegExp } from '@rocket.chat/tools';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import type { LocationPathname } from '@rocket.chat/ui-contexts';
import { useRouteParameter, useRouter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ModConsoleReportDetails from './ModConsoleReportDetails';
import ModerationConsoleTable from './ModerationConsoleTable';
import ModConsoleUsersTable from './UserReports/ModConsoleUsersTable';
import { PageTabs } from '../../../components/PageTabs';
import { getPermaLink } from '../../../lib/getPermaLink';
import { getRootUrlPathPrefix } from '../../../lib/meteorRuntimeConfig';

type TabType = 'users' | 'messages';

export type ModerationConsolePageProps = {
	tab: TabType;
	onSelectTab?: (tab: TabType) => void;
};

const ModerationConsolePage = ({ tab = 'messages', onSelectTab }: ModerationConsolePageProps) => {
	const { t } = useTranslation();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleRedirect = useCallback(
		async (mid: string) => {
			try {
				const permalink = await getPermaLink(mid);
				const url = new URL(permalink, 'http://localhost');
				const prefix = getRootUrlPathPrefix();
				const pathname = prefix ? url.pathname.replace(new RegExp(`^(${escapeRegExp(prefix)})+`), '') : url.pathname;
				router.navigate(`${pathname}${url.search}${url.hash}` as LocationPathname);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[dispatchToastMessage, router],
	);

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Moderation')} />
				<PageTabs
					items={[
						{ id: 'messages', label: t('Reported_Messages') },
						{ id: 'users', label: t('Reported_Users') },
					]}
					selected={tab}
					onSelect={(tab) => onSelectTab?.(tab)}
				/>
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
