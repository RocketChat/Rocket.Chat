import React, { FC } from 'react';

import { AccountPreferencesFormProvider } from '../providers/AccountPreferencesFormProvider';
import AccountPreferencesPage from './AccountPreferencesPage';

const AccountPreferencesPageWrapper: FC = () => (
	<AccountPreferencesFormProvider>
		<AccountPreferencesPage />
	</AccountPreferencesFormProvider>
);

export default AccountPreferencesPageWrapper;
