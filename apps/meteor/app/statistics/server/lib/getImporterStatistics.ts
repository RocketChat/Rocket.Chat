import { settings } from '../../../settings/server';

export function getImporterStatistics(): Record<string, unknown> {
	return {
		totalCSVImportedUsers: settings.get('CSV_Importer_Count'),
		totalHipchatEnterpriseImportedUsers: settings.get('Hipchat_Enterprise_Importer_Count'),
		totalSlackImportedUsers: settings.get('Slack_Importer_Count'),
		totalSlackUsersImportedUsers: settings.get('Slack_Users_Importer_Count'),
	};
}
