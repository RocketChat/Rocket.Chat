import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './LocalMessageSearchResults.stories';
import { expectListKeyboard, listWrapper } from '../../../../tests/mocks/utils/listContract';

const { Default, WithoutAvatars, Empty, Paginated } = composeStories(stories);
const wrapper = listWrapper(mockAppRoot().withSetting('Message_DateFormat', 'YYYY-MM-DD'));

it('shows the supplied author names, usernames, and avatars', () => {
	render(<Default />, { wrapper });

	expect(screen.getByText('Alice Doe')).toHaveAttribute('title', 'alice');
	expect(screen.getByText('bob')).toBeInTheDocument();
	expect(screen.getAllByRole('img', { hidden: true }).map((avatar) => avatar.getAttribute('data-username'))).toEqual([
		'alice',
		'bob',
		'carol',
	]);
});

it('does not show avatars when the preference is off', () => {
	render(<WithoutAvatars />, { wrapper });

	expect(screen.getByText('Alice Doe')).toBeInTheDocument();
	expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
});

it('groups hits by calendar day and keeps file lines separate', () => {
	render(<Default />, { wrapper });

	expect(screen.getAllByText('2026-10-26')).toHaveLength(1);
	expect(screen.getAllByText('2026-10-25')).toHaveLength(1);
	expect(screen.getByText('budget-2026.pdf')).toBeInTheDocument();
	expect(screen.getByText('budget').tagName).toBe('MARK');
});

it('passes the complete selected hit to the caller for room and thread navigation', async () => {
	const onOpenHit = jest.fn();
	render(<Default onOpenHit={onOpenHit} />, { wrapper });

	await userEvent.click(screen.getByText('needle'));
	await userEvent.click(screen.getByText('reply'));

	expect(onOpenHit.mock.calls.map(([hit]) => hit)).toEqual([Default.args.hits?.[0], Default.args.hits?.[2]]);
	expect(onOpenHit.mock.calls[1][0]).toMatchObject({ id: 'reply', rid: 'room', tmid: 'thread' });
});

it('opens the focused hit with Enter and Space', async () => {
	const onOpenHit = jest.fn();
	render(<Default onOpenHit={onOpenHit} />, { wrapper });
	const first = within(screen.getByRole('list')).getAllByRole('button')[0];
	act(() => first.focus());

	await userEvent.keyboard('{Enter} ');

	expect(onOpenHit).toHaveBeenCalledTimes(2);
	expect(onOpenHit).toHaveBeenLastCalledWith(Default.args.hits?.[0]);
});

it('follows the keyboard model of a list of message rows', async () => {
	render(<Default />, { wrapper });
	const list = screen.getByRole('list');

	await expectListKeyboard(list, within(list).getAllByRole('button')[0]);
});

it('renders an empty list without requesting navigation', () => {
	const onOpenHit = jest.fn();
	render(<Empty onOpenHit={onOpenHit} />, { wrapper });

	expect(within(screen.getByRole('list')).queryByRole('listitem')).not.toBeInTheDocument();
	expect(onOpenHit).not.toHaveBeenCalled();
});

it.each(Object.entries(composeStories(stories)).filter(([name]) => name !== 'Paginated'))(
	'%s has no accessibility violations',
	async (_, Story) => {
		const { container } = render(<Story />, { wrapper });

		expect(await axe(container)).toHaveNoViolations();
	},
);

describe('pagination and resize', () => {
	const originalResizeObserver = globalThis.ResizeObserver;
	const observers: { callback: () => void; observe: jest.Mock; disconnect: jest.Mock }[] = [];
	let clientHeight: number;

	beforeEach(() => {
		clientHeight = 300;
		jest.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(1000);
		jest.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(() => clientHeight);
		globalThis.ResizeObserver = jest.fn((callback: () => void) => {
			const observer = { callback, observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
			observers.push(observer);
			return observer;
		}) as unknown as typeof ResizeObserver;
	});

	afterEach(() => {
		globalThis.ResizeObserver = originalResizeObserver;
		observers.splice(0);
		jest.restoreAllMocks();
	});

	it('requests another page when the list does not fill the panel', () => {
		clientHeight = 900;
		const onEndReached = jest.fn();
		render(<Paginated onEndReached={onEndReached} />, { wrapper });

		expect(onEndReached).toHaveBeenCalledTimes(1);
		act(() => observers[0].callback());
		expect(onEndReached).toHaveBeenCalledTimes(1);
	});

	it('requests another page only when a changed panel size reaches the threshold', () => {
		const onEndReached = jest.fn();
		render(<Paginated onEndReached={onEndReached} />, { wrapper });

		act(() => observers[0].callback());
		expect(onEndReached).not.toHaveBeenCalled();
		clientHeight = 900;
		act(() => observers[0].callback());
		expect(onEndReached).toHaveBeenCalledTimes(1);
		act(() => observers[0].callback());
		expect(onEndReached).toHaveBeenCalledTimes(1);
	});

	it('requests another page within 200 pixels of the end', () => {
		const onEndReached = jest.fn();
		render(<Paginated onEndReached={onEndReached} />, { wrapper });
		const list = screen.getByRole('list');

		fireEvent.scroll(list, { target: { scrollTop: 499 } });
		expect(onEndReached).not.toHaveBeenCalled();
		fireEvent.scroll(list, { target: { scrollTop: 500 } });
		expect(onEndReached).toHaveBeenCalledTimes(1);
	});

	it('rechecks a new page and disconnects the old observer', () => {
		const onEndReached = jest.fn();
		const { rerender, unmount } = render(<Paginated onEndReached={onEndReached} />, { wrapper });
		const [firstObserver] = observers;
		clientHeight = 900;

		rerender(<Paginated hits={Paginated.args.hits?.slice(0, 2)} onEndReached={onEndReached} />);

		expect(firstObserver.disconnect).toHaveBeenCalledTimes(1);
		expect(onEndReached).toHaveBeenCalledTimes(1);
		expect(observers[1].observe).toHaveBeenCalledWith(screen.getByRole('list'));
		unmount();
		expect(observers[1].disconnect).toHaveBeenCalledTimes(1);
	});

	it('moves observers and keyboard bindings when the list mounts again', async () => {
		const onEndReached = jest.fn();
		const { rerender, unmount } = render(<Paginated key='first' onEndReached={onEndReached} />, { wrapper });
		const firstList = screen.getByRole('list');

		rerender(<Paginated key='second' onEndReached={onEndReached} />);

		expect(screen.getByRole('list')).not.toBe(firstList);
		expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
		const list = screen.getByRole('list');
		await expectListKeyboard(list, within(list).getAllByRole('button')[0]);
		unmount();
		expect(observers[1].disconnect).toHaveBeenCalledTimes(1);
	});
});
