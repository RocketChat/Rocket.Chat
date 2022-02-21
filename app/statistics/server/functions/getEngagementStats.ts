import { settings } from '../../../settings/server';
import { Invites } from '../../../models/server/raw';

function getCustomCSSStats(): number {
	const css = settings.get('theme-custom-css') as string;
	return css.split('\n').length;
}

function getCustomScriptStats(): number {
	const scriptOnLogOut = settings.get('Custom_Script_On_Logout') as string;
	const scriptLoggedOut = settings.get('Custom_Script_Logged_Out') as string;
	const scriptOnLoggedIn = settings.get('Custom_Script_Logged_In') as string;

	let count = 0;
	if (scriptOnLogOut !== '//Add your script') {
		count += scriptOnLogOut.split('\n').length;
	}
	if (scriptLoggedOut !== '//Add your script') {
		count += scriptLoggedOut.split('\n').length;
	}
	if (scriptOnLoggedIn !== '//Add your script') {
		count += scriptOnLoggedIn.split('\n').length;
	}

	return count;
}

export const engagementMetrics = {
	get: async (): Promise<Record<string, any>> => {
		const engagementMetrics: Record<string, any> = {};

		engagementMetrics.logoChange = Object.keys(settings.get('Assets_logo')).includes('url');
		engagementMetrics.customCSS = getCustomCSSStats();
		engagementMetrics.customScript = getCustomScriptStats();
		engagementMetrics.tabInvites = await Invites.find().count();

		return engagementMetrics;
	},
};
