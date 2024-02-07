import { action } from '@storybook/addon-actions';
import { type DecoratorFunction } from '@storybook/csf';
import type { Args, PreactFramework } from '@storybook/preact';
import { loremIpsum as originalLoremIpsum } from 'lorem-ipsum';

import gazzoAvatar from './assets/gazzo.jpg';
import martinAvatar from './assets/martin.jpg';
import tassoAvatar from './assets/tasso.jpg';

export const screenDecorator: DecoratorFunction<PreactFramework, Args> = (storyFn) => (
	<div style={{ display: 'flex', width: 365, height: 500 }}>{storyFn()}</div>
);

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

export const avatarResolver = (username: string) =>
	({
		'guilherme.gazzo': gazzoAvatar,
		'martin.schoeler': martinAvatar,
		'tasso.evangelista': tassoAvatar,
	}[username]);

export const attachmentResolver = (url: string) => url;

const createRandom = (s: number) => () => {
	s = Math.sin(s) * 10000;
	return s - Math.floor(s);
};
const loremIpsumRandom = createRandom(42);
export const loremIpsum = (options: Parameters<typeof originalLoremIpsum>[0]) =>
	originalLoremIpsum({ random: loremIpsumRandom, ...options });

export { gazzoAvatar, martinAvatar, tassoAvatar };

export { default as sampleAudio } from './assets/sample-audio.mp3';
export { default as sampleImage } from './assets/sample-image.jpg';
export { default as sampleVideo } from './assets/sample-video.mp4';
export { default as accessoryImage } from './assets/accessoryImage.png';
export { default as imageBlock } from './assets/imageBlock.png';
export { default as beepAudio } from './assets/beep.mp3';
