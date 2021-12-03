import React, { ReactElement, ReactNode, useEffect } from 'react';

import { unlockE2EE } from '../../../app/e2e/client/unlockE2EE';

type E2EEProviderProps = {
	children: ReactNode;
};

const E2EEProvider = ({ children }: E2EEProviderProps): ReactElement => {
	useEffect(() => unlockE2EE(), []);

	return <>{children}</>;
};

export default E2EEProvider;
