import React from 'react';

import SecurityPrivacyPage from './SecurityPrivacyPage';
import SettingsProvider from '../../providers/SettingsProvider';
import EditableSettingsProvider from '../../views/admin/settings/EditableSettingsProvider';

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
