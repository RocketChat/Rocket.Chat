import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import CallHistoryPage from './CallHistoryPage';
import type { CallHistoryTab } from './CallHistoryPageLayout';
import ContactsTab from '../contacts/ContactsTab';

const CallHistoryRoute = () => {
	const router = useRouter();

	const tab: CallHistoryTab = useRouteParameter('tab') === 'contacts' ? 'contacts' : 'calls';

	const handleChangeTab = useCallback(
		(next: CallHistoryTab) => router.navigate(next === 'contacts' ? '/call-history/contacts' : '/call-history'),
		[router],
	);

	if (tab === 'contacts') {
		return <ContactsTab tab={tab} onChangeTab={handleChangeTab} />;
	}

	return <CallHistoryPage tab={tab} onChangeTab={handleChangeTab} />;
};

export default CallHistoryRoute;
