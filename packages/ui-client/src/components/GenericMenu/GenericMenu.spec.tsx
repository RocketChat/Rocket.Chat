import nameToCharacterMapping from '@rocket.chat/icons';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import GenericMenu from './GenericMenu';
import * as stories from './GenericMenu.stories';
import type { GenericMenuItemProps } from './GenericMenuItem';

const mockedFunction = jest.fn();
const regular = {
	items: [
		{
			id: 'edit',
			content: 'Edit',
			icon: 'pencil' as const,
			onClick: mockedFunction,
		},
	],
};
const danger = {
	items: [
		{
			id: 'delete',
			content: 'Delete',
			icon: 'trash' as const,
			onClick: () => null,
			variant: 'danger',
		},
	],
};

const sections = [regular, danger];

describe('Room Actions Menu', () => {
	it('should render kebab menu with the list content', async () => {
		render(<GenericMenu title='Kebab' sections={sections} />, { wrapper: mockAppRoot().build() });

		await userEvent.click(screen.getByRole('button'));

		expect(await screen.findByText('Edit')).toBeInTheDocument();
		expect(await screen.findByText('Delete')).toBeInTheDocument();
	});

	it('should have two different sections, regular and danger', async () => {
		render(<GenericMenu title='Kebab' sections={sections} />, { wrapper: mockAppRoot().build() });

		await userEvent.click(screen.getByRole('button'));

		expect(screen.getAllByRole('presentation')).toHaveLength(2);
		expect(screen.getByRole('separator')).toBeInTheDocument();
	});

	it('should call the action when item clicked', async () => {
		render(<GenericMenu title='Kebab' sections={sections} />, { wrapper: mockAppRoot().build() });

		await userEvent.click(screen.getByRole('button'));
		await userEvent.click(screen.getAllByRole('menuitem')[0]);

		expect(mockedFunction).toHaveBeenCalled();
	});
});

describe('GenericMenu', () => {
	// Every menu in the app is built without nested items; adding sub menus must not change what they render.
	it.each(['sections', 'items'])('renders a menu without nested items as before (%s)', async (mode) => {
		render(
			mode === 'sections' ? (
				<GenericMenu title='Kebab' sections={sections} />
			) : (
				<GenericMenu title='Kebab' items={[...regular.items, ...danger.items]} />
			),
			{ wrapper: mockAppRoot().build() },
		);

		await userEvent.click(screen.getByRole('button'));

		expect(screen.getAllByRole('menuitem')).toHaveLength(2);
		expect(screen.queryByRole('menuitem', { expanded: false })).not.toBeInTheDocument();
		screen.getAllByRole('menuitem').forEach((item) => expect(item).not.toHaveAttribute('aria-haspopup'));
	});

	it('keeps a disabled flat item disabled', async () => {
		const onClick = jest.fn();
		render(<GenericMenu title='Kebab' items={[{ id: 'edit', content: 'Edit', disabled: true, onClick }]} />, {
			wrapper: mockAppRoot().build(),
		});

		await userEvent.click(screen.getByRole('button'));
		const item = screen.getByRole('menuitem', { name: 'Edit' });
		expect(item).toHaveAttribute('aria-disabled', 'true');
	});
});

describe('sub menus', () => {
	const buildItems = ({ onEdit = jest.fn(), onCopy = jest.fn(), onShare = jest.fn(), onDelete = jest.fn() } = {}) => [
		{ id: 'edit', icon: 'pencil' as const, content: 'Edit', onClick: onEdit },
		{
			id: 'share',
			icon: 'share' as const,
			content: 'Share',
			onClick: onShare,
			items: [
				{ id: 'copy', icon: 'copy' as const, content: 'Copy link', onClick: onCopy },
				{ id: 'delete', icon: 'trash' as const, content: 'Delete', variant: 'danger', onClick: onDelete },
				{ id: 'plain', content: 'Plain', onClick: jest.fn() },
			],
		},
	];

	const renderMenu = (mode: 'sections' | 'items', options?: Parameters<typeof buildItems>[0], callbackAction = jest.fn()) => {
		const items = buildItems(options);
		render(
			mode === 'sections' ? (
				<GenericMenu title='Kebab' sections={[{ items }]} callbackAction={callbackAction} />
			) : (
				<GenericMenu title='Kebab' items={items} callbackAction={callbackAction} />
			),
			{ wrapper: mockAppRoot().build() },
		);
		return { callbackAction };
	};

	const openRoot = async () => {
		await userEvent.click(screen.getByRole('button', { name: 'Kebab' }));
	};

	it('rejects nested items more than one level deep', () => {
		const items: GenericMenuItemProps[] = [
			{
				id: 'outer',
				items: [
					// @ts-expect-error a nested item cannot open a sub menu of its own
					{ id: 'inner', items: [{ id: 'deepest' }] },
				],
			},
		];
		expect(items).toHaveLength(1);
	});

	it.each(['sections', 'items'] as const)(
		'renders an item with nested items as a sub menu trigger that is closed until opened (%s)',
		async (mode) => {
			renderMenu(mode);
			await openRoot();

			const trigger = screen.getByRole('menuitem', { name: 'Share' });
			expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
			expect(within(trigger).getByText(nameToCharacterMapping.share, { selector: 'i' })).toBeInTheDocument();
			expect(within(trigger).getByText(nameToCharacterMapping['chevron-right'], { selector: 'i' })).toBeInTheDocument();
			expect(screen.queryByRole('menuitem', { name: 'Copy link' })).not.toBeInTheDocument();
		},
	);

	it('opens the sub menu with the mouse', async () => {
		renderMenu('sections');
		await openRoot();

		await userEvent.click(screen.getByRole('menuitem', { name: 'Share' }));

		expect(await screen.findByRole('menuitem', { name: 'Copy link' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
	});

	it('opens the sub menu with ArrowRight, moving focus to its first item', async () => {
		renderMenu('items');
		await openRoot();

		// The first ArrowDown focuses the first item of a menu opened with the mouse.
		await userEvent.keyboard('{ArrowDown}{ArrowDown}');
		await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveFocus());
		await userEvent.keyboard('{ArrowRight}');

		await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus());
		expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
	});

	it('calls the nested item action and callbackAction', async () => {
		const onCopy = jest.fn();
		const onShare = jest.fn();
		const { callbackAction } = renderMenu('sections', { onCopy, onShare });
		await openRoot();

		await userEvent.click(screen.getByRole('menuitem', { name: 'Share' }));
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy link' }));

		expect(onCopy).toHaveBeenCalledTimes(1);
		expect(callbackAction).toHaveBeenCalledTimes(1);
		expect(onShare).not.toHaveBeenCalled();
		expect(onCopy.mock.invocationCallOrder[0]).toBeLessThan(callbackAction.mock.invocationCallOrder[0]);
	});

	it('does not call anything when the trigger itself is selected', async () => {
		const onShare = jest.fn();
		const { callbackAction } = renderMenu('sections', { onShare });
		await openRoot();

		await userEvent.click(screen.getByRole('menuitem', { name: 'Share' }));
		await userEvent.keyboard('{ArrowLeft}');
		await userEvent.keyboard('{Enter}');

		expect(onShare).not.toHaveBeenCalled();
		expect(callbackAction).not.toHaveBeenCalled();
	});

	it('disables a nested item', async () => {
		const onClick = jest.fn();
		const callbackAction = jest.fn();
		render(
			<GenericMenu
				title='Kebab'
				callbackAction={callbackAction}
				sections={[{ items: [{ id: 'share', content: 'Share', items: [{ id: 'copy', content: 'Copy link', disabled: true, onClick }] }] }]}
			/>,
			{ wrapper: mockAppRoot().build() },
		);
		await openRoot();
		await userEvent.click(screen.getByRole('menuitem', { name: 'Share' }));

		const item = await screen.findByRole('menuitem', { name: 'Copy link' });
		expect(item).toHaveAttribute('aria-disabled', 'true');

		await userEvent.click(item);

		expect(onClick).not.toHaveBeenCalled();
		expect(callbackAction).not.toHaveBeenCalled();
	});

	it('a disabled trigger does not open', async () => {
		render(
			<GenericMenu
				title='Kebab'
				sections={[
					{ items: [{ id: 'share', content: 'Share', disabled: true, items: [{ id: 'copy', content: 'Copy link', onClick: jest.fn() }] }] },
				]}
			/>,
			{ wrapper: mockAppRoot().build() },
		);
		await openRoot();

		const trigger = screen.getByRole('menuitem', { name: 'Share' });
		expect(trigger).toHaveAttribute('aria-disabled', 'true');

		await userEvent.hover(trigger);
		await userEvent.click(trigger);
		await userEvent.keyboard('{ArrowRight}');

		expect(screen.queryByRole('menuitem', { name: 'Copy link' })).not.toBeInTheDocument();
	});

	it('styles a danger nested item', async () => {
		renderMenu('sections');
		await openRoot();
		await userEvent.click(screen.getByRole('menuitem', { name: 'Share' }));

		expect(await screen.findByRole('menuitem', { name: 'Delete' })).toHaveClass('rcx-item--danger');
		expect(screen.getByRole('menuitem', { name: 'Copy link' })).not.toHaveClass('rcx-item--danger');
	});

	it('aligns nested items without icon among nested items with one', async () => {
		renderMenu('sections');
		await openRoot();
		await userEvent.click(screen.getByRole('menuitem', { name: 'Share' }));

		const plain = await screen.findByRole('menuitem', { name: 'Plain' });
		const copy = screen.getByRole('menuitem', { name: 'Copy link' });
		expect(plain.querySelector('.rcx-option__column:empty')).toBeInTheDocument();
		expect(copy.querySelector('.rcx-option__column:empty')).toBeNull();
	});

	it('logs no warning or error when rendering and opening a sub menu', async () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

		render(
			<GenericMenu
				title='Kebab'
				sections={[{ items: [{ id: 'share', content: 'Share', items: [{ id: 'copy', content: 'Copy link', onClick: jest.fn() }] }] }]}
			/>,
			{ wrapper: mockAppRoot().build() },
		);
		await openRoot();
		await userEvent.click(screen.getByRole('menuitem', { name: 'Share' }));
		expect(await screen.findByRole('menuitem', { name: 'Copy link' })).toBeInTheDocument();

		expect(warn).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();

		warn.mockRestore();
		error.mockRestore();
	});

	// A status drawn beside the content is not part of the item's name, so the label says it instead.
	it('names an item by its label when it has one', async () => {
		render(
			<GenericMenu
				title='Kebab'
				sections={[
					{
						items: [
							{
								id: 'standup',
								content: 'Daily standup',
								status: 'Live',
								label: 'Daily standup, live',
								items: [{ id: 'join', content: 'Join' }],
							},
							{ id: 'weekly', content: 'Weekly sync', items: [{ id: 'open', content: 'Open' }] },
						],
					},
				]}
			/>,
			{ wrapper: mockAppRoot().build() },
		);
		await openRoot();

		expect(screen.getByRole('menuitem', { name: 'Daily standup, live' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Weekly sync' })).toBeInTheDocument();
	});

	describe('keyboard', () => {
		it('opens with ArrowRight, moves with ArrowDown and ArrowUp, closes one level with ArrowLeft and Escape', async () => {
			renderMenu('sections');
			await openRoot();

			await userEvent.keyboard('{ArrowDown}{ArrowDown}');
			const trigger = screen.getByRole('menuitem', { name: 'Share' });
			await waitFor(() => expect(trigger).toHaveFocus());

			await userEvent.keyboard('{ArrowRight}');
			await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus());

			await userEvent.keyboard('{ArrowDown}');
			expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
			await userEvent.keyboard('{ArrowUp}');
			expect(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus();

			await userEvent.keyboard('{ArrowLeft}');
			await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Copy link' })).not.toBeInTheDocument());
			expect(screen.getByRole('menu')).toBeInTheDocument();
			expect(trigger).toHaveFocus();

			await userEvent.keyboard('{ArrowRight}');
			await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus());

			await userEvent.keyboard('{Escape}');
			await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Copy link' })).not.toBeInTheDocument());
			expect(screen.getByRole('menuitem', { name: 'Share' })).toBeInTheDocument();

			await userEvent.keyboard('{Escape}');
			await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
		});

		it('selects a nested item with Enter', async () => {
			const onCopy = jest.fn();
			const { callbackAction } = renderMenu('sections', { onCopy });
			await openRoot();

			await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
			await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus());
			await userEvent.keyboard('{Enter}');

			expect(onCopy).toHaveBeenCalledTimes(1);
			expect(callbackAction).toHaveBeenCalledTimes(1);
		});
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

	// Played first: a story with a `play` is the open menu it leaves behind, which is what the audit has to see.
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { baseElement, container } = render(<Story />, { wrapper: mockAppRoot().build() });
		await Story.play?.({ canvasElement: container });

		// `region` off: the menu is rendered on its own here; in the product it sits inside the page's landmarks.
		// `aria-allowed-role` off: Fuselage draws every menu item, flat or nested, as a `label` with `role='menuitem'`.
		const results = await axe(baseElement, { rules: { 'region': { enabled: false }, 'aria-allowed-role': { enabled: false } } });
		expect(results).toHaveNoViolations();
	});
});
