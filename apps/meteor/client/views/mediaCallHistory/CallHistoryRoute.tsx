import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import CallHistoryPage from './CallHistoryPage';
import type { CallHistoryTab } from './CallHistoryPageLayout';
import ContactsTab from '../contacts/ContactsTab';

const CallHistoryRoute = () => {
	const router = useRouter();

	const tabParam = useRouteParameter('tab');
	const tab: CallHistoryTab = tabParam === 'contacts' || tabParam === 'favorites' ? tabParam : 'calls';

	const handleChangeTab = useCallback(
		(next: CallHistoryTab) => router.navigate(next === 'calls' ? '/call-history' : `/call-history/${next}`),
		[router],
	);

	if (tab !== 'calls') {
		return <ContactsTab key={tab} tab={tab} onChangeTab={handleChangeTab} />;
	}

	return <CallHistoryPage tab={tab} onChangeTab={handleChangeTab} />;
};

export default CallHistoryRoute;
