import type { TFunction } from 'i18next';

import type { ConferenceLink } from './ConferenceLink';
import type { BuildVideoCallMenuSectionsInput } from './buildVideoCallMenuSections';
import { buildVideoCallMenuSections } from './buildVideoCallMenuSections';

const weekly: ConferenceLink = { _id: 'weekly-id', title: 'Weekly sync', url: 'weekly-sync', ongoing: false };
const standup: ConferenceLink = { _id: 'standup-id', title: 'Daily standup', url: 'daily-standup', ongoing: true };
const retro: ConferenceLink = { _id: 'retro-id', title: 'Retro', url: 'retro', ongoing: false };

const buildHandlers = () => ({
	onStart: jest.fn(),
	onCreate: jest.fn(),
	onOpen: jest.fn(),
	onCopy: jest.fn(),
	onRename: jest.fn(),
	onDelete: jest.fn(),
});

const buildInput = (overrides: Partial<BuildVideoCallMenuSectionsInput> = {}): BuildVideoCallMenuSectionsInput => ({
	links: [],
	canStart: true,
	canManage: true,
	startDisabled: false,
	handlers: buildHandlers(),
	t: jest.fn((key: string) => key) as unknown as TFunction,
	...overrides,
});

const contents = (items: { content?: unknown }[]) => items.map(({ content }) => content);

const linkSection = (input: BuildVideoCallMenuSectionsInput) => {
	const section = buildVideoCallMenuSections(input).find(({ title }) => title === 'Conference_links');
	if (!section) {
		throw new Error('no links section');
	}
	return section;
};

const nestedOf = (input: BuildVideoCallMenuSectionsInput, link: ConferenceLink) => {
	const item = linkSection(input).items.find(({ textValue }) => textValue === link.title);
	return item?.items ?? [];
};

describe('section 1', () => {
	it('has Start conference only with canStart', () => {
		const [section] = buildVideoCallMenuSections(buildInput({ canManage: false }));
		expect(section.title).toBeUndefined();
		expect(contents(section.items)).toEqual(['Start_conference']);
	});

	it('has Create link only with canManage', () => {
		const [section] = buildVideoCallMenuSections(buildInput({ canStart: false }));
		expect(contents(section.items)).toEqual(['Create_link']);
	});

	it('has both in order', () => {
		const [section] = buildVideoCallMenuSections(buildInput());
		expect(contents(section.items)).toEqual(['Start_conference', 'Create_link']);
	});

	it('is absent with neither', () => {
		const sections = buildVideoCallMenuSections(buildInput({ canStart: false, canManage: false, links: [weekly] }));
		expect(sections).toHaveLength(1);
		expect(sections[0].title).toBe('Conference_links');
	});
});

it('startDisabled disables Start conference and Create link and nothing else', () => {
	const disabledInput = buildInput({ startDisabled: true, links: [weekly, standup] });
	const [actions] = buildVideoCallMenuSections(disabledInput);
	expect(actions.items.map(({ disabled }) => disabled)).toEqual([true, true]);

	const links = linkSection(disabledInput).items;
	expect(links.flatMap((item) => [item, ...(item.items ?? [])]).some(({ disabled }) => disabled)).toBe(false);

	const [enabled] = buildVideoCallMenuSections(buildInput());
	expect(enabled.items.some(({ disabled }) => disabled)).toBe(false);
});

it('section 1 items call their handlers', () => {
	const handlers = buildHandlers();
	const [section] = buildVideoCallMenuSections(buildInput({ handlers }));

	section.items[0].onClick?.();
	expect(handlers.onStart).toHaveBeenCalledTimes(1);
	expect(handlers.onCreate).not.toHaveBeenCalled();

	section.items[1].onClick?.();
	expect(handlers.onCreate).toHaveBeenCalledTimes(1);
	expect(handlers.onStart).toHaveBeenCalledTimes(1);
});

describe('section 2', () => {
	it('is absent with no links', () => {
		const sections = buildVideoCallMenuSections(buildInput());
		expect(sections).toHaveLength(1);
		expect(sections.some(({ title }) => title === 'Conference_links')).toBe(false);
	});

	it('lists one item per link in order, titled Conference_links', () => {
		const sections = buildVideoCallMenuSections(buildInput({ links: [weekly, standup, retro] }));
		expect(sections).toHaveLength(2);
		expect(sections[1].title).toBe('Conference_links');
		expect(contents(sections[1].items)).toEqual(['Weekly sync', 'Daily standup', 'Retro']);
		expect(sections[1].items.map(({ textValue }) => textValue)).toEqual(['Weekly sync', 'Daily standup', 'Retro']);
	});

	// People without call-management still need the links the room already has.
	it('is present without any permission', () => {
		const sections = buildVideoCallMenuSections(buildInput({ canStart: false, canManage: false, links: [weekly] }));
		expect(sections).toEqual([expect.objectContaining({ title: 'Conference_links' })]);
	});
});

it('marks only an ongoing link', () => {
	const { items } = linkSection(buildInput({ links: [weekly, standup] }));
	expect(items.map(({ status }) => status)).toEqual([undefined, 'Ongoing']);
});

describe('link actions', () => {
	it('offers Join call for an ongoing link and Open for the others', () => {
		const input = buildInput({ links: [weekly, standup] });
		expect(nestedOf(input, standup)[0].content).toBe('Join_call');
		expect(nestedOf(input, weekly)[0].content).toBe('Open');
	});

	it('offers Copy link to everyone', () => {
		const input = buildInput({ canStart: false, canManage: false, links: [weekly] });
		expect(contents(nestedOf(input, weekly))).toEqual(['Open', 'Copy_link']);
	});

	it('offers Rename and Delete only with canManage', () => {
		expect(contents(nestedOf(buildInput({ links: [standup] }), standup))).toEqual(['Join_call', 'Copy_link', 'Rename', 'Delete']);
		expect(contents(nestedOf(buildInput({ canManage: false, links: [standup] }), standup))).toEqual(['Join_call', 'Copy_link']);
	});

	it('marks Delete as danger', () => {
		const nested = nestedOf(buildInput({ links: [weekly] }), weekly);
		expect(nested.map(({ variant }) => variant)).toEqual([undefined, undefined, undefined, 'danger']);
	});

	it('passes the link to each handler', () => {
		const handlers = buildHandlers();
		const input = buildInput({ handlers, links: [weekly, standup] });

		nestedOf(input, standup).forEach(({ onClick }) => onClick?.());

		expect(handlers.onOpen).toHaveBeenCalledWith(standup);
		expect(handlers.onCopy).toHaveBeenCalledWith(standup);
		expect(handlers.onRename).toHaveBeenCalledWith(standup);
		expect(handlers.onDelete).toHaveBeenCalledWith(standup);
		[handlers.onOpen, handlers.onCopy, handlers.onRename, handlers.onDelete].forEach((handler) => {
			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler.mock.calls[0][0]).toBe(standup);
		});
	});

	it('gives link rows no action of their own', () => {
		const { items } = linkSection(buildInput({ links: [weekly] }));
		expect(items[0].onClick).toBeUndefined();
	});
});

it('returns no sections with neither permission and no links', () => {
	expect(buildVideoCallMenuSections(buildInput({ canStart: false, canManage: false }))).toEqual([]);
});

it('gives every item a unique, stable id', () => {
	const input = buildInput({ links: [weekly, standup, retro] });
	const ids = (sections: ReturnType<typeof buildVideoCallMenuSections>) =>
		sections.flatMap(({ items }) => items.flatMap((item) => [item.id, ...(item.items ?? []).map(({ id }) => id)]));

	const first = ids(buildVideoCallMenuSections(input));
	expect(new Set(first).size).toBe(first.length);
	expect(ids(buildVideoCallMenuSections(input))).toEqual(first);
	expect(first.filter((id) => id.includes(weekly._id))).toHaveLength(5);
});

it('keeps its input untouched and returns equal sections for equal input', () => {
	const links = Object.freeze([Object.freeze({ ...weekly }), Object.freeze({ ...standup })]);
	const snapshot = JSON.stringify(links);
	const input = buildInput({ links });

	const first = buildVideoCallMenuSections(input);
	expect(JSON.stringify(links)).toBe(snapshot);
	expect(JSON.stringify(buildVideoCallMenuSections(input))).toBe(JSON.stringify(first));
});

it('uses only the feature keys', () => {
	const input = buildInput({ links: [weekly, standup] });
	buildVideoCallMenuSections(input);

	const keys = new Set((input.t as unknown as jest.Mock).mock.calls.map(([key]) => key));
	expect(keys).toEqual(
		new Set(['Start_conference', 'Create_link', 'Conference_links', 'Ongoing', 'Join_call', 'Open', 'Copy_link', 'Rename', 'Delete']),
	);
});

it('gives the actions their icons', () => {
	const input = buildInput({ links: [weekly, standup] });
	const [actions, links] = buildVideoCallMenuSections(input);

	expect(actions.items.map(({ icon }) => icon)).toEqual(['video', 'link']);
	expect(links.items.map(({ icon }) => icon)).toEqual([undefined, undefined]);
	expect(nestedOf(input, standup).map(({ icon }) => icon)).toEqual(['phone', 'copy', 'pencil', 'trash']);
	expect(nestedOf(input, weekly)[0].icon).toBe('new-window');
});
