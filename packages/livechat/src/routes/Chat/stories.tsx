import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { avatarResolver, beepAudio, screenDecorator } from '../../../.storybook/helpers';
import Chat from './component';

const now = new Date(Date.parse('2021-01-01T00:00:00.000Z'));

const normalizeMessages = (messages: any[] = []) =>
	messages.map((message, i) => ({
		...message,
		ts: new Date(now.getTime() - (15 - i) * 60000 - (i < 5 ? 24 * 60 * 60 * 1000 : 0)).toISOString(),
	}));

export default {
	title: 'Routes/Chat',
	component: Chat,
	args: {
		title: '',
		sound: { src: beepAudio, play: false },
		avatarResolver,
		uid: 1,
		agent: {
			name: 'Guilherme Gazzo',
			status: 'online',
			email: 'guilherme.gazzo@rocket.chat',
			phone: '+55 99 99999 9999',
			username: 'guilherme.gazzo',
		},
		messages: normalizeMessages([
			{
				_id: 1,
				u: { _id: 1, username: 'tasso.evangelista' },
				msg: 'Lorem ipsum dolor sit amet, ea usu quod eirmod lucilius, mea veri viris concludaturque id, vel eripuit fabulas ea',
			},
			{ _id: 2, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Putent appareat te sea, dico recusabo pri te' },
			{ _id: 3, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Iudico utinam volutpat eos eu, sadipscing repudiandae pro te' },
			{ _id: 4, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Movet doming ad ius, mel id adversarium disputationi' },
			{ _id: 5, u: { _id: 1, username: 'tasso.evangelista' }, msg: 'Adhuc latine et nec' },
			{ _id: 6, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Vis at verterem adversarium concludaturque' },
			{ _id: 7, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Sea no congue scripta persecuti, sed amet fabulas voluptaria ex' },
			{ _id: 8, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Invidunt repudiandae has eu' },
			{ _id: 9, u: { _id: 1, username: 'tasso.evangelista' }, msg: 'Veri soluta suscipit mel no' },
		]),
		typingUsernames: [],
		emoji: false,
		uploads: false,
		loading: false,
		limitTextLength: 0,
		registrationRequired: false,
		onTop: action('top'),
		onBottom: action('bottom'),
		onUpload: action('upload'),
		onSubmit: action('submit'),
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ComponentProps<typeof Chat>>;

const Template: Story<ComponentProps<typeof Chat>> = (args) => <Chat {...args} />;

export const Loading = Template.bind({});
Loading.storyName = 'loading';
Loading.args = {
	messages: [],
	loading: true,
};

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const WithTypingUser = Template.bind({});
WithTypingUser.storyName = 'with typing user';
WithTypingUser.args = {
	typingUsernames: ['guilherme.gazzo'],
};

export const WithTriggerMessages = Template.bind({});
WithTriggerMessages.storyName = 'with trigger messages';
WithTriggerMessages.args = {
	messages: normalizeMessages([
		{ _id: 1, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Putent appareat te sea, dico recusabo pri te' },
		{ _id: 2, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Iudico utinam volutpat eos eu, sadipscing repudiandae pro te' },
	]),
	lastReadMessageId: 8,
	registrationRequired: true,
};
