import { addScript } from './inject';
import { settings } from '../../settings/server';

const getContent = (): string => `

${
	process.env.BUGSNAG_CLIENT
		? `window.__BUGSNAG_KEY__ = "${process.env.BUGSNAG_CLIENT}";\n
window.addEventListener('load', function bugsnagInit() {
	const event = new Event('bugsnag-error-boundary');
	window.dispatchEvent(event);
	window.removeEventListener('load', bugsnagInit);
});
`
		: ''
}

${process.env.DISABLE_ANIMATION ? 'window.DISABLE_ANIMATION = true;\n' : ''}

// Custom_Script_Logged_Out
if(window.customScriptLoggedOutHandler) {
	window.removeEventListener('Custom_Script_Logged_Out', window.customScriptLoggedOutHandler);
}
window.customScriptLoggedOutHandler = function() {
	${settings.get('Custom_Script_Logged_Out')}
};
window.addEventListener('Custom_Script_Logged_Out', window.customScriptLoggedOutHandler);


// Custom_Script_Logged_In
if(window.customScriptLoggedInHandler) {
	window.removeEventListener('Custom_Script_Logged_In', window.customScriptLoggedInHandler);
}
window.customScriptLoggedInHandler = function() {
	${settings.get('Custom_Script_Logged_In')}
};
window.addEventListener('Custom_Script_Logged_In', window.customScriptLoggedInHandler);


// Custom_Script_On_Logout
if(window.customScriptOnLogoutHandler) {
	window.removeEventListener('Custom_Script_On_Logout', window.customScriptOnLogoutHandler);
}
window.customScriptOnLogoutHandler = function() {
	${settings.get('Custom_Script_On_Logout')}
};
window.addEventListener('Custom_Script_On_Logout', window.customScriptOnLogoutHandler);

${
	settings.get('Accounts_ForgetUserSessionOnWindowClose')
		? `
window.addEventListener('load', function forgetUserSessionInit() {
	if (window.localStorage) {
		Object.keys(window.localStorage).forEach(function(key) {
			window.sessionStorage.setItem(key, window.localStorage.getItem(key));
		});
		window.localStorage.clear();
		Meteor._localStorage = window.sessionStorage;
		Accounts.config({ clientStorage: 'session'  });
	}
	window.removeEventListener('load', forgetUserSessionInit);
});
`
		: ''
}`;

settings.watchMultiple(
	['Custom_Script_Logged_Out', 'Custom_Script_Logged_In', 'Custom_Script_On_Logout', 'Accounts_ForgetUserSessionOnWindowClose'],
	() => {
		const content = getContent();
		addScript('scripts', content);
	},
);
