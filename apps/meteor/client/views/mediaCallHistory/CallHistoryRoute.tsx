import { useState } from 'react';

import CallHistoryPage from './CallHistoryPage';
import type { CallHistoryTab } from './CallHistoryPageLayout';
import ContactsTab from '../contacts/ContactsTab';

const CallHistoryRoute = () => {
	const [tab, setTab] = useState<CallHistoryTab>('calls');

	if (tab === 'contacts') {
		return <ContactsTab tab={tab} onChangeTab={setTab} />;
	}

	return <CallHistoryPage tab={tab} onChangeTab={setTab} />;
};

export default CallHistoryRoute;
