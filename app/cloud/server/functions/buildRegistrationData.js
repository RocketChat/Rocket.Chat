import { settings } from '../../../settings/server';
import { Users, Statistics } from '../../../models/server';
import { statistics } from '../../../statistics';
import { LICENSE_VERSION } from '../license';

export function buildWorkspaceRegistrationData() {
	const stats = Statistics.findLast() || statistics.get();

	const address = settings.get('Site_Url');
	const siteName = settings.get('Site_Name');

	// If we have it lets send it because likely an update
	const workspaceId = settings.get('Cloud_Workspace_Id');

	const firstUser = Users.getOldest({ name: 1, emails: 1 });
	const contactName = firstUser && firstUser.name;
	let contactEmail = firstUser && firstUser.emails && firstUser.emails[0].address;

	if (settings.get('Organization_Email')) {
		contactEmail = settings.get('Organization_Email');
	}

	const allowMarketing = settings.get('Allow_Marketing_Emails');

	const accountName = settings.get('Organization_Name');

	const website = settings.get('Website');

	const npsEnabled = settings.get('NPS_survey_enabled');

	const agreePrivacyTerms = settings.get('Cloud_Service_Agree_PrivacyTerms');

	const { organizationType, industry, size: orgSize, country, language, serverType: workspaceType } = stats.wizard;

	return {
		uniqueId: stats.uniqueId,
		workspaceId,
		address,
		contactName,
		contactEmail,
		allowMarketing,
		accountName,
		organizationType,
		industry,
		orgSize,
		country,
		language,
		agreePrivacyTerms,
		website,
		siteName,
		workspaceType,
		deploymentMethod: stats.deploy.method,
		deploymentPlatform: stats.deploy.platform,
		version: stats.version,
		licenseVersion: LICENSE_VERSION,
		enterpriseReady: true,
		setupComplete: settings.get('Show_Setup_Wizard') === 'completed',
		npsEnabled,
	};
}
