import React, { ReactElement, ReactNode, useEffect } from 'react';

import { attachE2EEManagement } from '../../../app/e2e/client/attachE2EEManagement';

type E2EEProviderProps = {
	children: ReactNode;
};

const E2EEProvider = ({ children }: E2EEProviderProps): ReactElement => {
	useEffect(() => attachE2EEManagement(), []);

	return <>{children}</>;
};

export default E2EEProvider;
