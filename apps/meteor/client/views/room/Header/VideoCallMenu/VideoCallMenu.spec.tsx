import { mockAppRoot } from '@rocket.chat/mock-providers';
import { HeaderToolbar, HeaderToolbarAction } from '@rocket.chat/ui-client';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TFunction } from 'i18next';
import { axe } from 'jest-axe';

import type { ConferenceLink } from './ConferenceLink';
import VideoCallMenu from './VideoCallMenu';
import * as stories from './VideoCallMenu.stories';
import { buildVideoCallMenuSections } from './buildVideoCallMenuSections';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

const weekly: ConferenceLink = { _id: 'weekly-id', title: 'Weekly sync', url: 'weekly-sync', ongoing: false };
const standup: ConferenceLink = { _id: 'standup-id', title: 'Daily standup', url: 'daily-standup', ongoing: true };

const t = ((key: string) => key) as unknown as TFunction;

const buildHandlers = () => ({
	onStart: jest.fn(),
	onCreate: jest.fn(),
	onOpen: jest.fn(),
	onCopy: jest.fn(),
	onRename: jest.fn(),
	onDelete: jest.fn(),
});

const showMenu = ({ startDisabled = false, disabled = false, links = [weekly, standup] } = {}) => {
	const handlers = buildHandlers();
	render(
		<VideoCallMenu
			title='Video_call'
			disabled={disabled}
			className='video-call-menu'
			sections={buildVideoCallMenuSections({ links, canStart: true, canManage: true, startDisabled, handlers, t })}
		/>,
		{ wrapper: mockAppRoot().build() },
	);
	return handlers;
};

const openMenu = async () => {
	await userEvent.click(screen.getByRole('button', { name: 'Video_call' }));
};

describe('VideoCallMenu', () => {
	// Played first: a story with a `play` is the open menu it leaves behind, which is what the audit has to see.
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { baseElement, container } = render(<Story />, { wrapper: mockAppRoot().build() });
		await Story.play?.({ canvasElement: container });

		// `region` off: the button is rendered on its own here; in the product it sits in the room header's toolbar.
		// `aria-allowed-role` off: Fuselage draws every menu item as a `label` with `role='menuitem'`.
		const results = await axe(baseElement, { rules: { 'region': { enabled: false }, 'aria-allowed-role': { enabled: false } } });
		expect(results).toHaveNoViolations();
	});

	it('renders a header toolbar button named by the title and no menu until it is opened', () => {
		showMenu();

		expect(screen.getByRole('button', { name: 'Video_call' })).toBeInTheDocument();
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	// The menu replaces a plain header action, so it has to sit in the toolbar as one of them.
	it('looks like its sibling header actions', () => {
		render(
			<HeaderToolbar aria-label='Room actions'>
				<HeaderToolbarAction icon='video' title='Sibling' />
				<VideoCallMenu
					title='Video_call'
					sections={buildVideoCallMenuSections({
						links: [],
						canStart: true,
						canManage: true,
						startDisabled: false,
						handlers: buildHandlers(),
						t,
					})}
				/>
			</HeaderToolbar>,
			{ wrapper: mockAppRoot().build() },
		);

		const sibling = screen.getByRole('button', { name: 'Sibling' });
		const menu = screen.getByRole('button', { name: 'Video_call' });
		expect(menu.className).toBe(sibling.className);
	});

	it('opens the menu with both sections', async () => {
		showMenu();
		await openMenu();

		const items = await screen.findAllByRole('menuitem');
		expect(items.map((item) => item.getAttribute('data-key'))).toEqual([
			'start-conference',
			'create-link',
			'link-weekly-id',
			'link-standup-id',
		]);
		expect(screen.getByRole('separator')).toBeInTheDocument();
		const links = screen.getByRole('group', { name: 'Conference_links' });
		expect(within(links).getByRole('menuitem', { name: 'Weekly sync' })).toBeInTheDocument();
		expect(within(within(links).getByRole('menuitem', { name: 'Daily standup' })).getByText('Ongoing')).toBeInTheDocument();
	});

	it.each([
		['Join call', standup, 'Join_call', 'onOpen'],
		['Open', weekly, 'Open', 'onOpen'],
		['Copy link', weekly, 'Copy_link', 'onCopy'],
		['Rename', weekly, 'Rename', 'onRename'],
		['Delete', standup, 'Delete', 'onDelete'],
	] as const)('calls the handler of each sub menu action with its link (%s)', async (_name, link, label, handler) => {
		const handlers = showMenu();
		await openMenu();

		await userEvent.click(screen.getByRole('menuitem', { name: link.title }));
		await userEvent.click(await screen.findByRole('menuitem', { name: label }));

		expect(handlers[handler]).toHaveBeenCalledTimes(1);
		expect(handlers[handler]).toHaveBeenCalledWith(link);
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
	});

	it('calls onStart and onCreate', async () => {
		const handlers = showMenu();
		await openMenu();
		await userEvent.click(screen.getByRole('menuitem', { name: 'Start_conference' }));
		expect(handlers.onStart).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

		await openMenu();
		await userEvent.click(screen.getByRole('menuitem', { name: 'Create_link' }));
		expect(handlers.onCreate).toHaveBeenCalledTimes(1);
	});

	it('does not open when disabled', async () => {
		showMenu({ disabled: true });

		const button = screen.getByRole('button', { name: 'Video_call' });
		expect(button).toBeDisabled();
		await userEvent.click(button);
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	it('renders a disabled trigger for empty sections', () => {
		render(<VideoCallMenu title='Video_call' sections={[]} />, { wrapper: mockAppRoot().build() });

		expect(screen.getByRole('button', { name: 'Video_call' })).toBeDisabled();
	});

	it('passes className to the trigger', () => {
		showMenu();

		expect(screen.getByRole('button', { name: 'Video_call' })).toHaveClass('video-call-menu');
	});

	it('keeps links usable when starting is disabled', async () => {
		const handlers = showMenu({ startDisabled: true });
		await openMenu();

		expect(screen.getByRole('menuitem', { name: 'Start_conference' })).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getByRole('menuitem', { name: 'Create_link' })).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getByRole('menuitem', { name: 'Weekly sync' })).not.toHaveAttribute('aria-disabled');

		await userEvent.click(screen.getByRole('menuitem', { name: 'Weekly sync' }));
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy_link' }));
		expect(handlers.onCopy).toHaveBeenCalledWith(weekly);
	});
});
