import { addScript } from './inject';
import { settings } from '../../settings';

/**
 * Hands the client the page size to ask paginated endpoints for.
 *
 * `API_Upper_Count_Limit` is not a public setting, so the client has no other way to learn it
 * and has to guess — and a guess above the cap is silently clamped by `getPaginationItems`,
 * leaving the caller to page with a stride the server never agreed to. Read by
 * `client/lib/getApiCountLimit`, which falls back to its own default when this is absent.
 */
const getApiCountLimitScript = (): string => {
	const limit = settings.get<number>('API_Upper_Count_Limit');

	if (!Number.isInteger(limit) || limit <= 0) {
		return '';
	}

	return `window.__API_COUNT_LIMIT__ = ${limit};\n`;
};

const getContent = (): string => `

${
	process.env.BUGSNAG_CLIENT
		? `window.__BUGSNAG_KEY__ = "${process.env.BUGSNAG_CLIENT}";\n
window.addEventListener('load', function() {
	const event = new Event('bugsnag-error-boundary');
	window.dispatchEvent(event);
});
`
		: ''
}

${process.env.DISABLE_ANIMATION ? 'window.DISABLE_ANIMATION = true;\n' : ''}

${getApiCountLimitScript()}

// Custom_Script_Logged_Out
window.addEventListener('Custom_Script_Logged_Out', function() {
	${settings.get('Custom_Script_Logged_Out')}
})


// Custom_Script_Logged_In
window.addEventListener('Custom_Script_Logged_In', function() {
	${settings.get('Custom_Script_Logged_In')}
})


// Custom_Script_On_Logout
window.addEventListener('Custom_Script_On_Logout', function() {
	${settings.get('Custom_Script_On_Logout')}
})

${settings.get('Accounts_ForgetUserSessionOnWindowClose') ? `window.Accounts_ForgetUserSessionOnWindowClose = true;` : ''}`;

settings.watchMultiple(
	[
		'Custom_Script_Logged_Out',
		'Custom_Script_Logged_In',
		'Custom_Script_On_Logout',
		'Accounts_ForgetUserSessionOnWindowClose',
		'API_Upper_Count_Limit',
	],
	() => {
		const content = getContent();
		addScript('scripts', content);
	},
);
