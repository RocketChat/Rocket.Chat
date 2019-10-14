import { settings } from '../../../settings';
import { Users } from '../../../models';
import { statistics } from '../../../statistics';

export function buildWorkspaceRegistrationData() {
	const stats = statistics.get();

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

	return {
		uniqueId: stats.uniqueId,
		workspaceId,
		address,
		contactName,
		contactEmail,
		allowMarketing,
		accountName,
		website,
		siteName,
		deploymentMethod: stats.deploy.method,
		deploymentPlatform: stats.deploy.platform,
		version: stats.version,
	};
}
