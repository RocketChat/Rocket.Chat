import type { SettingValue } from '@rocket.chat/core-typings';
import { Statistics, Users } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { statistics } from '../../../statistics/server';
import { LICENSE_VERSION } from '../license';

export type WorkspaceRegistrationData<T> = {
	uniqueId: string;
	workspaceId: SettingValue;
	address: SettingValue;
	contactName: string;
	contactEmail: T;
	seats: number;
	allowMarketing: SettingValue;
	accountName: SettingValue;
	organizationType: string;
	industry: string;
	orgSize: string;
	country: string;
	language: string;
	agreePrivacyTerms: SettingValue;
	website: SettingValue;
	siteName: SettingValue;
	workspaceType: unknown;
	deploymentMethod: string;
	deploymentPlatform: string;
	version: unknown;
	licenseVersion: number;
	enterpriseReady: boolean;
	setupComplete: boolean;
	connectionDisable: boolean;
	npsEnabled: SettingValue;
};

export async function buildWorkspaceRegistrationData<T extends string | undefined>(contactEmail: T): Promise<WorkspaceRegistrationData<T>> {
	const stats = (await Statistics.findLast()) || (await statistics.get());

	const address = settings.get('Site_Url');
	const siteName = settings.get('Site_Name');
	const workspaceId = settings.get('Cloud_Workspace_Id');
	const allowMarketing = settings.get('Allow_Marketing_Emails');
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
		accountName,
		organizationType: String(organizationType),
		industry: String(industry),
		orgSize: String(orgSize),
		country: String(country),
		language: String(language),
		agreePrivacyTerms,
		website,
		siteName,
		workspaceType: String(workspaceType),
		deploymentMethod: stats.deploy.method,
		deploymentPlatform: stats.deploy.platform,
		version: stats.version,
		licenseVersion: LICENSE_VERSION,
		enterpriseReady: true,
		setupComplete: setupWizardState === 'completed',
		connectionDisable: !registerServer,
		npsEnabled,
	};
}
