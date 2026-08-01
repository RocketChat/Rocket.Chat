import type { Meta, StoryFn } from '@storybook/react';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import PreFlight from './PreFlight';

// GenericMenu (device pickers) calls i18n.exists — the storybook preview has
// no i18next init, so bootstrap a bare instance for these stories.
if (!i18next.isInitialized) {
	void i18next.use(initReactI18next).init({ lng: 'en', resources: {}, interpolation: { escapeValue: false } });
}

export default {
	title: 'V2/Views/PreFlight',
	component: PreFlight,
	decorators: [
		(Story) => (
			<div style={{ width: '62rem', height: '33.5rem', display: 'flex' }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof PreFlight>;

const user = { id: 'u1', displayName: 'Bob Burnquist', avatarUrl: 'https://placekitten.com/48/48' };

export const Default: StoryFn<typeof PreFlight> = () => (
	<PreFlight statusText='Bob and Alice are in this call' joinLabel='Join call' user={user} onJoin={console.log} />
);

export const DmCaller: StoryFn<typeof PreFlight> = () => (
	<PreFlight
		statusText='Alice will be notified when you start the call'
		joinLabel='Call Alice'
		user={user}
		initialCam={false}
		onJoin={console.log}
	/>
);

export const Joining: StoryFn<typeof PreFlight> = () => (
	<PreFlight statusText='Connecting you to Bob and Alice…' joinLabel='Join call' joining user={user} onJoin={console.log} />
);

export const ListenOnlyPolicy: StoryFn<typeof PreFlight> = () => (
	<PreFlight
		statusText='Bob and Alice are in this call'
		helperText='Calls are listen-only for your role — take part with the call thread, reactions, and raise hand'
		joinLabel='Join call'
		devicesForbidden
		user={user}
		onJoin={console.log}
	/>
);
