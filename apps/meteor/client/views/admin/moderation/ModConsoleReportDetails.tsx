import type { IUser } from '@rocket.chat/core-typings';
import { Tabs, TabsItem, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/fuselage';
import { useTranslation, useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import UserMessages from './UserMessages';
import UserReportInfo from './UserReports/UserReportInfo';
import { Contextualbar, ContextualbarClose, ContextualbarDialog } from '../../../components/Contextualbar';

type ModConsoleReportDetailsProps = {
	userId: IUser['_id'];
	default: string;
	onRedirect: (mid: string) => void;
};

const ModConsoleReportDetails = ({ userId, default: defaultTab, onRedirect }: ModConsoleReportDetailsProps) => {
	const t = useTranslation();
	const [tab, setTab] = useState<string>(defaultTab);
	const moderationRoute = useRouter();

	const activeTab = useRouteParameter('tab');

	return (
		<ContextualbarDialog>
			<Contextualbar>
				<ContextualbarHeader>
					<ContextualbarTitle>{t('Reports')}</ContextualbarTitle>
					<ContextualbarClose onClick={() => moderationRoute.navigate(`/admin/moderation/${activeTab}`, { replace: true })} />
				</ContextualbarHeader>
				<Tabs paddingBlockStart={8}>
					<TabsItem selected={tab === 'messages'} onClick={() => setTab('messages')}>
						{t('Messages')}
					</TabsItem>
					<TabsItem selected={tab === 'users'} onClick={() => setTab('users')}>
						{t('User')}
					</TabsItem>
				</Tabs>
				{tab === 'messages' && <UserMessages userId={userId} onRedirect={onRedirect} />}
				{tab === 'users' && <UserReportInfo userId={userId} />}
			</Contextualbar>
		</ContextualbarDialog>
	);
};

export default ModConsoleReportDetails;
