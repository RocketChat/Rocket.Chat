import type { Meta, StoryFn } from '@storybook/preact';

import type { ChatProps } from './index';
import Chat from './index';
import { screenDecorator, storeDecorator } from '../../../.storybook/helpers';
import store, { type StoreState } from '../../store';

type StoryArgs = ChatProps & Partial<StoreState>;

const now = new Date(Date.parse('2021-01-01T00:00:00.000Z'));

const normalizeMessages = (messages: any[] = []) =>
	messages.map((message, i) => ({
		...message,
		ts: new Date(now.getTime() - (15 - i) * 60000 - (i < 5 ? 24 * 60 * 60 * 1000 : 0)).toISOString(),
	}));

// The connector runs the raw agent through formatAgent, so provide the server-shaped agent.
const agent = {
	_id: '1',
	name: 'Guilherme Gazzo',
	status: 'online',
	username: 'guilherme.gazzo',
	emails: [{ address: 'guilherme.gazzo@rocket.chat' }],
	phone: [{ phoneNumber: '+55 99 99999 9999' }],
};

export default {
	title: 'Routes/Chat',
	component: Chat,
	args: {
		agent,
		typing: [],
		loading: false,
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
	},
	decorators: [storeDecorator, screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<StoryArgs>;

const Template: StoryFn<StoryArgs> = (args) => <Chat {...args} />;

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
	typing: ['guilherme.gazzo'],
};

export const WithTriggerMessages = Template.bind({});
WithTriggerMessages.storyName = 'with trigger messages';
WithTriggerMessages.args = {
	messages: normalizeMessages([
		{ _id: 1, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Putent appareat te sea, dico recusabo pri te' },
		{ _id: 2, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Iudico utinam volutpat eos eu, sadipscing repudiandae pro te' },
	]),
	lastReadMessageId: '8',
	config: {
		...store.state.config,
		settings: { ...store.state.config.settings, registrationForm: true, nameFieldRegistrationForm: true },
	},
};
