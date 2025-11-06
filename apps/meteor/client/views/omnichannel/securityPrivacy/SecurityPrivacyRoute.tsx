import SecurityPrivacyPage from './SecurityPrivacyPage';
import SettingsProvider from '../../../providers/SettingsProvider';
import EditableSettingsProvider from '../../admin/settings/EditableSettingsProvider';

const SecurityPrivacyRoute = () => {
	return (
		<SettingsProvider>
			<EditableSettingsProvider>
				<SecurityPrivacyPage />
			</EditableSettingsProvider>
		</SettingsProvider>
	);
};

export default SecurityPrivacyRoute;
