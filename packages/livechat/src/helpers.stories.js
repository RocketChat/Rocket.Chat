import { action } from '@storybook/addon-actions';
import { loremIpsum as originalLoremIpsum } from 'lorem-ipsum';

import gazzoAvatar from '../.storybook/assets/gazzo.jpg';
import martinAvatar from '../.storybook/assets/martin.jpg';
import tassoAvatar from '../.storybook/assets/tasso.jpg';

export const screenDecorator = (storyFn) => <div style={{ display: 'flex', width: 365, height: 500 }}>{storyFn()}</div>;

export const screenProps = () => ({
	theme: {
		color: '',
		fontColor: '',
		iconColor: '',
	},
	notificationsEnabled: true,
	minimized: false,
	windowed: false,
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

export { default as sampleAudio } from '../.storybook/assets/sample-audio.mp3';
export { default as sampleImage } from '../.storybook/assets/sample-image.jpg';
export { default as sampleVideo } from '../.storybook/assets/sample-video.mp4';
export { default as accessoryImage } from '../.storybook/assets/accessoryImage.png';
export { default as imageBlock } from '../.storybook/assets/imageBlock.png';
export { default as beepAudio } from '../.storybook/assets/beep.mp3';
