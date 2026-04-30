import { addScript } from './inject';
import { settings } from '../../settings/server';

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

// Custom_Script_Logged_Out
window.addEventListener('Custom_Script_Logged_Out', function() {
	${settings.get<string>('Custom_Script_Logged_Out')}
})


// Custom_Script_Logged_In
window.addEventListener('Custom_Script_Logged_In', function() {
	${settings.get<string>('Custom_Script_Logged_In')}
})


// Custom_Script_On_Logout
window.addEventListener('Custom_Script_On_Logout', function() {
	${settings.get<string>('Custom_Script_On_Logout')}
})
`;

settings.watchMultiple(['Custom_Script_Logged_Out', 'Custom_Script_Logged_In', 'Custom_Script_On_Logout'], () => {
	const content = getContent();
	addScript('scripts', content);
});
