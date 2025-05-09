import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import CallTable from './CallTable';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

// TODO Check if I need to type the setstateaction params, if I should do:
// { setCallReload: Dispatch<SetStateAction<(param: () => void) => void>> }
const CallTab = (): ReactElement => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <CallTable />;
	}

	return <NotAuthorizedPage />;
};

export default CallTab;
