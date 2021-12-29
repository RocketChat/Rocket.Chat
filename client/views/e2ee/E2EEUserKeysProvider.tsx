import React, { ReactElement, ReactNode, useEffect } from 'react';

import { IUser } from '../../../definition/IUser';
import { attachE2EEManagement } from '../../lib/e2ee/attachE2EEManagement';
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
