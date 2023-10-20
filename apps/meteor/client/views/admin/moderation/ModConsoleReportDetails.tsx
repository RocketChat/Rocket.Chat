import type { IUser } from '@rocket.chat/core-typings';
import { Tabs, TabsItem, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/fuselage';
import { type TranslationKey, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

import { Contextualbar, ContextualbarClose } from '../../../components/Contextualbar';
import UserMessages from './UserMessages';
import UserReportInfo from './UserReports/UserReportInfo';

type ModConsoleReportDetailsProps = {
	userId: IUser['_id'];
	default: string;
	onRedirect: (mid: string) => void;
};

const tabs = ['Messages', 'Users'];

const ModConsoleReportDetails = ({ userId, default: defaultTab, onRedirect }: ModConsoleReportDetailsProps) => {
	const t = useTranslation();
	const [tab, setTab] = useState<string>(defaultTab);
	const moderationRoute = useRouter();

	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Reports')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => moderationRoute.navigate('/admin/moderation', { replace: true })} />
			</ContextualbarHeader>
			<Tabs>
				{tabs.map((tabName) => (
					<TabsItem key={tabName || ''} selected={tab === tabName} onClick={() => setTab(tabName)}>
						{t(tabName as TranslationKey)}
					</TabsItem>
				))}
			</Tabs>

			{tab === 'Messages' && <UserMessages userId={userId} onRedirect={onRedirect} />}
			{tab === 'Users' && <UserReportInfo userId={userId} />}
		</Contextualbar>
	);
};

export default ModConsoleReportDetails;
