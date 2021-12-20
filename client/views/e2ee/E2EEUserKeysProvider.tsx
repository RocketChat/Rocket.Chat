import React, { ReactElement, ReactNode, useEffect } from 'react';

import { attachE2EEManagement } from '../../../app/e2e/client/attachE2EEManagement';
import { IUser } from '../../../definition/IUser';
import { useUserKeys } from './useUserKeys';

type EffectiveE2EEProviderProps = {
	children: ReactNode;
	uid: IUser['_id'];
};

const E2EEUserKeysProvider = ({ children, uid }: EffectiveE2EEProviderProps): ReactElement => {
	useEffect(() => attachE2EEManagement(), []);

	useUserKeys(uid);

	return <>{children}</>;
};

export default E2EEUserKeysProvider;
