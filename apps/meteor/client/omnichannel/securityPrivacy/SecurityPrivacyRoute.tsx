import React from 'react';

import SettingsProvider from '../../providers/SettingsProvider';
import EditableSettingsProvider from '../../views/admin/settings/EditableSettingsProvider';
import SecurityPrivacyPage from './SecurityPrivacyPage';

const SecurityPrivacyRoute = () => {
	return (
		<SettingsProvider privileged>
			<EditableSettingsProvider>
				<SecurityPrivacyPage />
			</EditableSettingsProvider>
		</SettingsProvider>
	);
};

export default SecurityPrivacyRoute;
