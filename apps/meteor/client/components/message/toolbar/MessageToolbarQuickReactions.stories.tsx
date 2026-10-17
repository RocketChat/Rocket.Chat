import {
	Avatar,
	Box,
	IconButton,
	Message,
	MessageBody,
	MessageContainer,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageNameContainer,
	MessageTimestamp,
	MessageToolbar,
	MessageToolbarItem,
	MessageToolbarWrapper,
	MessageUsername,
} from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { userEvent, within } from 'storybook/test';

import MessageToolbarQuickReactions from './MessageToolbarQuickReactions';
import en from '../../../../../../packages/i18n/src/locales/en.i18n.json';
import { useEmojiPickerData } from '../../../contexts/EmojiPickerContext';
import EmojiPickerProvider from '../../../providers/EmojiPickerProvider';
import EmojiPicker from '../../../views/composer/EmojiPicker';
import { useNativeEmoji } from '../../../views/root/hooks/useNativeEmoji';

// Everything below is made up: no real people, rooms or messages.

const FREQUENT_EMOJIS: [emoji: string, score: number][] = [
	['rocket', 40],
	['joy', 30],
	['heart_eyes', 20],
];
const RECENT_EMOJIS = ['heart_eyes', 'rocket', 'joy'];

const AVATAR_COLORS = ['#1D74F5', '#F5455C', '#2DE0A5', '#F38C39', '#9F22C7'];

const initialsAvatar = (name: string) => {
	const initials = name
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('');
	const color = AVATAR_COLORS[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${color}"/><text x="100" y="100" dy=".35em" text-anchor="middle" font-family="Inter, sans-serif" font-size="88" font-weight="600" fill="#fff">${initials}</text></svg>`;
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// The source locale, with plurals flattened the way i18next reads them, so the new strings show without a rebuilt package.
const translations = Object.fromEntries(
	Object.entries(en as Record<string, string | Record<string, string>>).flatMap(([key, value]) =>
		typeof value === 'string' ? [[key, value]] : Object.entries(value).map(([form, text]) => [`${key}_${form}`, text]),
	),
);

const NativeEmojis = ({ children }: { children: ReactNode }) => {
	useNativeEmoji();
	return <>{children}</>;
};

const emojis: Decorator = (Story) => (
	<NativeEmojis>
		<EmojiPickerProvider>
			<Story />
		</EmojiPickerProvider>
	</NativeEmojis>
);

const appRoot = mockAppRoot().withTranslations('en', 'core', translations).withPermission('manage-emoji').buildStoryDecorator();

const storageKey = (key: string) => `fuselage-localStorage-${key}`;

export default {
	title: 'Message/QuickReactions',
	component: MessageToolbarQuickReactions,
	parameters: { layout: 'fullscreen' },
	decorators: [emojis, appRoot],
	beforeEach: () => {
		const saved = ['emoji.frequent', 'emoji.recent'].map((key) => [key, localStorage.getItem(storageKey(key))] as const);
		localStorage.setItem(storageKey('emoji.frequent'), JSON.stringify(FREQUENT_EMOJIS));
		localStorage.setItem(storageKey('emoji.recent'), JSON.stringify(RECENT_EMOJIS));

		return () => {
			for (const [key, value] of saved) {
				if (value === null) {
					localStorage.removeItem(storageKey(key));
				} else {
					localStorage.setItem(storageKey(key), value);
				}
			}
		};
	},
} satisfies Meta<typeof MessageToolbarQuickReactions>;

type FakeMessageProps = { name: string; username: string; time: string; children: ReactNode; toolbar?: ReactNode };

const FakeMessage = ({ name, username, time, children, toolbar }: FakeMessageProps) => (
	<Message>
		<MessageLeftContainer>
			<Avatar url={initialsAvatar(name)} size='x36' />
		</MessageLeftContainer>
		<MessageContainer>
			<MessageHeader>
				<MessageNameContainer>
					<MessageName>{name}</MessageName> <MessageUsername>@{username}</MessageUsername>
				</MessageNameContainer>
				<MessageTimestamp>{time}</MessageTimestamp>
			</MessageHeader>
			<MessageBody>{children}</MessageBody>
		</MessageContainer>
		{toolbar}
	</Message>
);

const ToolbarWithQuickReactions = () => {
	const { quickReactions } = useEmojiPickerData();

	return (
		<MessageToolbarWrapper visible>
			<MessageToolbar aria-label='Message actions'>
				<MessageToolbarQuickReactions reactions={quickReactions} onReact={() => undefined} />
				<MessageToolbarItem icon='add-reaction' title='Add reaction' />
				<MessageToolbarItem icon='quote' title='Quote' />
				<MessageToolbarItem icon='thread' title='Reply in thread' />
				<MessageToolbarItem icon='arrow-forward' title='Forward message' />
				<MessageToolbarItem icon='kebab' title='More' />
			</MessageToolbar>
		</MessageToolbarWrapper>
	);
};

const Conversation = () => (
	<Box backgroundColor='surface-room' paddingBlock={40} width='x900'>
		<FakeMessage name='Alex Rivera' username='alex.rivera' time='10:42 AM' toolbar={<ToolbarWithQuickReactions />}>
			The new onboarding checklist is on staging. Could someone run through it before Friday&apos;s demo?
		</FakeMessage>
		<FakeMessage name='Sam Carter' username='sam.carter' time='10:45 AM'>
			On it, I&apos;ll post my notes in the thread.
		</FakeMessage>
		<FakeMessage name='Priya Nair' username='priya.nair' time='10:47 AM'>
			I can cover the mobile flow.
		</FakeMessage>
	</Box>
);

/** The toolbar as it shows on hover: the user's three most frequent emojis. */
export const InTheMessageToolbar: StoryObj = {
	render: () => <Conversation />,
};

/** Hovering the quick reactions opens a second line with the rest of the frequent emojis and the suggested ones. */
export const ExpandedOnHover: StoryObj = {
	render: () => <Conversation />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.hover(await canvas.findByRole('button', { name: 'rocket' }));
	},
};

const OpenEmojiPicker = () => {
	const [reference, setReference] = useState<HTMLButtonElement | null>(null);

	return (
		<Box backgroundColor='surface-room' padding={24} width='x420' height='x600'>
			<IconButton ref={setReference} icon='emoji' title='Emoji' small />
			{reference && <EmojiPicker reference={reference} onClose={() => undefined} onPickEmoji={() => undefined} />}
		</Box>
	);
};

/** The picker opens on the user's recent emojis, followed by the suggested ones. */
export const SuggestedInThePicker: StoryObj = {
	render: () => <OpenEmojiPicker />,
};
