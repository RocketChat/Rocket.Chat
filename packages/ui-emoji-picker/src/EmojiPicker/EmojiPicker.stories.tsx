import { Button } from '@rocket.chat/fuselage';
import { extractTranslationNamespaces } from '@rocket.chat/i18n';
import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import type { ContextType, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';

import EmojiPicker from './EmojiPicker';
import { EmojiPickerContext } from '../contexts/EmojiPickerContext';
import { EmojiRegistryContext, type EmojiPackages } from '../contexts/EmojiRegistryContext';
import type { CategoriesIndexes, EmojiPickerItem } from '../lib/emoji';
import { getCategoriesList } from '../lib/emoji';

const translations = extractTranslationNamespaces(en);

const SKIN_TONES = ['\u{1F3FB}', '\u{1F3FC}', '\u{1F3FD}', '\u{1F3FE}', '\u{1F3FF}'];

const nativeEmojis: Record<string, Record<string, string>> = {
	people: {
		grinning: '😀',
		smile: '😄',
		joy: '😂',
		wink: '😉',
		heart_eyes: '😍',
		thinking: '🤔',
		wave: '👋',
		thumbsup: '👍',
		clap: '👏',
		ok_hand: '👌',
	},
	nature: { dog: '🐶', cat: '🐱', fox: '🦊', panda_face: '🐼', sunflower: '🌻', evergreen_tree: '🌲' },
	food: { apple: '🍎', pizza: '🍕', coffee: '☕', cake: '🍰' },
	activity: { soccer: '⚽', basketball: '🏀', guitar: '🎸', trophy: '🏆' },
	travel: { airplane: '✈️', rocket: '🚀', beach_umbrella: '🏖️', mountain: '⛰️' },
	objects: { bulb: '💡', books: '📚', gift: '🎁', key: '🔑' },
	symbols: { heart: '❤️', star: '⭐', sparkles: '✨', white_check_mark: '✅' },
	flags: { checkered_flag: '🏁', rainbow_flag: '🏳️‍🌈', pirate_flag: '🏴‍☠️', triangular_flag_on_post: '🚩' },
};

const tonedEmojis = ['wave', 'thumbsup', 'clap', 'ok_hand'];

const renderEmoji = (unicode: string) => `<span class="emoji">${unicode}</span>`;

const listEntry = (name: string, category: string, emojiPackage: string): EmojiPackages['list'][string] => ({
	name,
	category,
	emojiPackage,
	shortnames: [],
	uc_base: '',
	uc_greedy: '',
	uc_match: '',
	uc_output: '',
});

const createRegistry = (): EmojiPackages => {
	const unicodes = new Map<string, string>();
	const registry: EmojiPackages = { packages: {}, list: {} };

	for (const [category, emojis] of Object.entries(nativeEmojis)) {
		for (const [name, unicode] of Object.entries(emojis)) {
			unicodes.set(name, unicode);
			registry.list[`:${name}:`] = listEntry(name, category, 'native');

			if (tonedEmojis.includes(name)) {
				SKIN_TONES.forEach((modifier, index) => {
					const tonedName = `${name}_tone${index + 1}`;
					unicodes.set(tonedName, `${unicode}${modifier}`);
					registry.list[`:${tonedName}:`] = listEntry(tonedName, category, 'native');
				});
			}
		}
	}

	registry.list[':party_rocket:'] = listEntry('party_rocket', 'rocket', 'emojiCustom');

	registry.packages = {
		base: {
			emojiCategories: [{ key: 'recent', i18n: 'Frequently_Used' }],
			categoryIndex: 0,
			emojisByCategory: { recent: ['thumbsup', 'joy', 'party_rocket'] },
			toneList: {},
			render: (message) => message,
			renderPicker: (emojiToRender) => registry.packages[registry.list[emojiToRender]?.emojiPackage]?.renderPicker(emojiToRender),
		},
		native: {
			emojiCategories: [
				{ key: 'people', i18n: 'Smileys_and_People' },
				{ key: 'nature', i18n: 'Animals_and_Nature' },
				{ key: 'food', i18n: 'Food_and_Drink' },
				{ key: 'activity', i18n: 'Activity' },
				{ key: 'travel', i18n: 'Travel_and_Places' },
				{ key: 'objects', i18n: 'Objects' },
				{ key: 'symbols', i18n: 'Symbols' },
				{ key: 'flags', i18n: 'Flags' },
			],
			emojisByCategory: Object.fromEntries(Object.entries(nativeEmojis).map(([category, emojis]) => [category, Object.keys(emojis)])),
			toneList: Object.fromEntries(tonedEmojis.map((name) => [name, 1])),
			render: (message) => message,
			renderPicker: (emojiToRender) => {
				const unicode = unicodes.get(emojiToRender.replace(/:/g, ''));
				return unicode && renderEmoji(unicode);
			},
		},
		emojiCustom: {
			emojiCategories: [{ key: 'rocket', i18n: 'Custom' }],
			emojisByCategory: { rocket: ['party_rocket'] },
			toneList: {},
			render: (message) => message,
			renderPicker: () => renderEmoji('🚀'),
		},
	};

	return registry;
};

const registry = createRegistry();

const createEmojiListByCategory = (tone: number): [EmojiPickerItem[], CategoriesIndexes] => {
	const items: EmojiPickerItem[] = [];
	const categoriesIndexes: CategoriesIndexes = [];

	for (const category of getCategoriesList(registry)) {
		categoriesIndexes.push({ key: category.key, index: items.length });
		items.push({ category: category.key, i18n: category.i18n });

		const emojis = Object.values(registry.packages).flatMap((emojiPackage) =>
			(emojiPackage.emojisByCategory[category.key] ?? []).map((name) => {
				const tonedName = tone > 0 && name in emojiPackage.toneList ? `${name}_tone${tone}` : name;
				return { emoji: name, image: registry.packages.base.renderPicker(`:${tonedName}:`) ?? '', category: category.key };
			}),
		);

		for (let index = 0; index < emojis.length; index += 9) {
			items.push(emojis.slice(index, index + 9));
		}
	}

	return [items, categoriesIndexes];
};

type EmojiPickerStoryProviderProps = {
	tone: number;
	children: ReactNode;
};

const EmojiPickerStoryProvider = ({ tone, children }: EmojiPickerStoryProviderProps) => {
	const [actualTone, setActualTone] = useState(tone);
	const [currentCategory, setCurrentCategory] = useState('recent');
	const [customItemsLimit, setCustomItemsLimit] = useState(90);
	const [recentEmojis, setRecentEmojis] = useState(registry.packages.base.emojisByCategory.recent);
	const [emojiToPreview, setEmojiToPreview] = useState<{ emoji: string; name: string } | null>(null);

	const [emojiListByCategory, categoriesIndexes] = useMemo(() => createEmojiListByCategory(actualTone), [actualTone]);

	const value: NonNullable<ContextType<typeof EmojiPickerContext>> = {
		open: () => undefined,
		isOpen: true,
		close: () => undefined,
		emojiToPreview,
		handlePreview: (emoji, name) => setEmojiToPreview({ emoji, name }),
		handleRemovePreview: () => setEmojiToPreview(null),
		addRecentEmoji: (emoji) => setRecentEmojis((recent) => [emoji, ...recent.filter((item) => item !== emoji)]),
		emojiListByCategory,
		recentEmojis,
		setRecentEmojis,
		actualTone,
		currentCategory,
		setCurrentCategory,
		customItemsLimit,
		setCustomItemsLimit,
		setActualTone,
		quickReactions: [],
		categoriesIndexes,
	};

	return (
		<EmojiRegistryContext.Provider value={registry}>
			<EmojiPickerContext.Provider value={value}>{children}</EmojiPickerContext.Provider>
		</EmojiRegistryContext.Provider>
	);
};

type EmojiPickerStoryProps = {
	tone: number;
	onPickEmoji: (emoji: string) => void;
	onAddCustomEmoji: () => void;
};

const EmojiPickerStory = ({ tone, onPickEmoji, onAddCustomEmoji }: EmojiPickerStoryProps) => {
	const [reference, setReference] = useState<HTMLElement | null>(null);
	const [open, setOpen] = useState(true);

	return (
		<EmojiPickerStoryProvider key={tone} tone={tone}>
			<Button ref={setReference} onClick={() => setOpen(true)}>
				Open emoji picker
			</Button>
			{reference && open && (
				<EmojiPicker reference={reference} onClose={() => setOpen(false)} onPickEmoji={onPickEmoji} onAddCustomEmoji={onAddCustomEmoji} />
			)}
		</EmojiPickerStoryProvider>
	);
};

const createAppRoot = ({ canManageEmoji }: { canManageEmoji: boolean }) => {
	const builder = mockAppRoot().withTranslations('en', 'core', translations.core).withJohnDoe();

	return (canManageEmoji ? builder.withPermission('manage-emoji') : builder).build();
};

const AppRoot = createAppRoot({ canManageEmoji: false });
const AdminAppRoot = createAppRoot({ canManageEmoji: true });

const meta = {
	component: EmojiPickerStory,
	args: {
		tone: 0,
		onPickEmoji: action('onPickEmoji'),
		onAddCustomEmoji: action('onAddCustomEmoji'),
	},
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story, { parameters }) => {
			const Root = parameters.canManageEmoji ? AdminAppRoot : AppRoot;

			// The picker opens above or below its anchor depending on which half of the page the anchor is in.
			return (
				<Root>
					<div style={{ display: 'flex', alignItems: 'flex-end', height: '100vh', padding: 16, boxSizing: 'border-box' }}>
						<Story />
					</div>
				</Root>
			);
		},
	],
} satisfies Meta<typeof EmojiPickerStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Only users allowed to manage emoji are offered the shortcut to add a custom one.
export const CanAddCustomEmoji: Story = {
	parameters: { canManageEmoji: true },
};

export const WithSkinTone: Story = {
	args: { tone: 3 },
};

export const Searching: Story = {
	play: async ({ canvasElement }) => {
		await userEvent.type(await within(canvasElement.ownerDocument.body).findByRole('textbox'), 'thumb');
	},
};

export const NoSearchResults: Story = {
	play: async ({ canvasElement }) => {
		await userEvent.type(await within(canvasElement.ownerDocument.body).findByRole('textbox'), 'zzz');
	},
};
