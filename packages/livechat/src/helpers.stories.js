import { action } from '@storybook/addon-actions';
import { boolean, color } from '@storybook/addon-knobs';
import { loremIpsum as originalLoremIpsum } from 'lorem-ipsum';

import gazzoAvatar from '../.storybook/assets/gazzo.jpg';
import martinAvatar from '../.storybook/assets/martin.jpg';
import tassoAvatar from '../.storybook/assets/tasso.jpg';

export const centered = (storyFn) => (
	<div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', overflow: 'auto' }}>
		<div style={{ margin: 'auto', maxHeight: '100%' }}>{storyFn()}</div>
	</div>
);

export const screenCentered = (storyFn, ...args) =>
	centered(() => <div style={{ display: 'flex', width: '365px', height: '500px' }}>{storyFn()}</div>, ...args);

export const screenProps = () => ({
	theme: {
		color: color('theme.color', ''),
		fontColor: color('theme.fontColor', ''),
		iconColor: color('theme.iconColor', ''),
	},
	notificationsEnabled: boolean('notificationsEnabled', true),
	minimized: boolean('minimized', false),
	windowed: boolean('windowed', false),
	onEnableNotifications: action('enableNotifications'),
	onDisableNotifications: action('disableNotifications'),
	onMinimize: action('minimize'),
	onRestore: action('restore'),
	onOpenWindow: action('openWindow'),
});

export const avatarResolver = (username) =>
	({
		'guilherme.gazzo': gazzoAvatar,
		'martin.schoeler': martinAvatar,
		'tasso.evangelista': tassoAvatar,
	}[username]);

export const attachmentResolver = (url) => url;

const createRandom = (s) => () => {
	s = Math.sin(s) * 10000;
	return s - Math.floor(s);
};
const loremIpsumRandom = createRandom(42);
export const loremIpsum = (options) => originalLoremIpsum({ random: loremIpsumRandom, ...options });

export { gazzoAvatar, martinAvatar, tassoAvatar };
