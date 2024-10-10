import React from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import SettingsProvider from '../../providers/SettingsProvider';
import EditableSettingsProvider from '../../views/admin/settings/EditableSettingsProvider';
import NotAuthorizedPage from '../../views/notAuthorized/NotAuthorizedPage';
import SecurityPrivacyPage from './SecurityPrivacyPage';

const SecurityPrivacyRoute = () => {
	const isEnterprise = useHasLicenseModule('livechat-enterprise');

	if (!isEnterprise) {
		return <NotAuthorizedPage />;
	}

	return (
		<SettingsProvider privileged>
			<EditableSettingsProvider>
				<SecurityPrivacyPage />
			</EditableSettingsProvider>
		</SettingsProvider>
	);
};

export default SecurityPrivacyRoute;
