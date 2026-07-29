import type { Decorator } from '@storybook/preact';
import { loremIpsum as originalLoremIpsum } from 'lorem-ipsum';
import { action } from 'storybook/actions';

import gazzoAvatar from './assets/gazzo.jpg';
import martinAvatar from './assets/martin.jpg';
import tassoAvatar from './assets/tasso.jpg';
import type { ScreenContextValue } from '../src/components/Screen/ScreenProvider';
import { ScreenContext } from '../src/components/Screen/ScreenProvider';
import store, { StoreContext, type StoreState } from '../src/store';

export const screenDecorator: Decorator = (storyFn) => (
	<div style={{ display: 'flex', width: 365, height: 500 }}>
		<ScreenContext.Provider value={screenProps()}>{storyFn()}</ScreenContext.Provider>
	</div>
);

export const screenProps = (): ScreenContextValue => ({
	hideWatermark: false,
	livechatLogo: undefined,
	notificationsEnabled: true,
	minimized: false,
	expanded: false,
	windowed: false,
	sound: undefined,
	alerts: [],
	modal: null,
	onEnableNotifications: action('enableNotifications'),
	onDisableNotifications: action('disableNotifications'),
	onMinimize: action('minimize'),
	onRestore: action('restore'),
	onOpenWindow: action('openWindow'),
	onDismissAlert: action('dismissAlert'),
	dismissNotification: action('dismissNotification'),
	theme: {
		color: '',
		fontColor: '',
		iconColor: '',
		hideAgentAvatar: false,
		hideGuestAvatar: true,
		hideExpandChat: false,
	},
});

// Feeds arbitrary store data from a story's args into StoreContext, so container components that
// read from `useStore()` render against it. Args are treated as a partial store state override.
export const storeDecorator: Decorator<Partial<StoreState>> = (storyFn, { args }) => (
	<StoreContext.Provider
		value={{
			...store.state,
			...args,
			dispatch: store.setState.bind(store),
			on: store.on.bind(store),
			off: store.off.bind(store),
		}}
	>
		{storyFn()}
	</StoreContext.Provider>
);

export const avatarResolver = (username: string) =>
	({
		'guilherme.gazzo': gazzoAvatar,
		'martin.schoeler': martinAvatar,
		'tasso.evangelista': tassoAvatar,
	})[username];

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
