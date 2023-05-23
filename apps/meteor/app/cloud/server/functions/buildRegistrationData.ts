/* eslint-disable @typescript-eslint/naming-convention */
import { Statistics, Users } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { statistics } from '../../../statistics/server';
import { LICENSE_VERSION } from '../license';

interface WorkspaceRegistrationData {
	uniqueId: string;
	workspaceId: string;
	contactName: string;
	contactEmail: string | undefined;
	seats: number;
	allowMarketing: boolean;
	accountName: string;
	website: string;
	address: string;
	siteName: string;
	workspaceType: string;
	organizationType: string;
	industry: string;
	orgSize: string;
	country: string;
	language: string;
	agreePrivacyTerms: boolean;
	deploymentMethod: string;
	deploymentPlatform: string;
	version: string;
	setupComplete: boolean;
	enterpriseReady: boolean;
	licenseVersion: number;
	npsEnabled: boolean;
	connectionDisable: boolean;

	deploymentName?: string;
	domainName?: string;
	regionCode?: string;
	marketing?: WorkspaceTrialMarketing;
}

interface WorkspaceTrialMarketing {
	utmContent: string;
	utmMedium: string;
	utmSource: string;
	utmCampaign: string;
}
export async function buildWorkspaceRegistrationData<T extends string | undefined>(contactEmail: T): Promise<WorkspaceRegistrationData> {
	const stats = (await Statistics.findLast()) || (await statistics.get());

	const address = String(settings.get('Site_Url'));
	const siteName = String(settings.get('Site_Name'));
	const workspaceId = String(settings.get('Cloud_Workspace_Id'));
	const allowMarketing = Boolean(settings.get('Allow_Marketing_Emails'));
	const accountName = settings.get('Organization_Name');
	const website = settings.get('Website');
	const npsEnabled = settings.get('NPS_survey_enabled');
	const agreePrivacyTerms = settings.get('Cloud_Service_Agree_PrivacyTerms');
	const setupWizardState = settings.get('Show_Setup_Wizard');

	const firstUser = await Users.getOldest({ projection: { name: 1, emails: 1 } });
	const contactName = firstUser?.name || '';

	const { organizationType, industry, size: orgSize, country, language, serverType: workspaceType, registerServer } = stats.wizard;
	const seats = await Users.getActiveLocalUserCount();

	return {
		uniqueId: stats.uniqueId,
		workspaceId,
		address,
		contactName,
		contactEmail,
		seats,
		allowMarketing,
		accountName: String(accountName),
		organizationType: String(organizationType),
		industry: String(industry),
		orgSize: String(orgSize),
		country: String(country),
		language: String(language),
		agreePrivacyTerms: Boolean(agreePrivacyTerms),
		website: String(website),
		siteName,
		workspaceType: String(workspaceType),
		deploymentMethod: stats.deploy.method,
		deploymentPlatform: stats.deploy.platform,
		version: String(stats.version),
		licenseVersion: LICENSE_VERSION,
		enterpriseReady: true,
		setupComplete: setupWizardState === 'completed',
		connectionDisable: !registerServer,
		npsEnabled: Boolean(npsEnabled),
	};
}
