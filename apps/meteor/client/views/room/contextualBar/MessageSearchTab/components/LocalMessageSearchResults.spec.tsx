import type { E2EESearchHit } from '@rocket.chat/desktop-api';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LocalMessageSearchResults from './LocalMessageSearchResults';
import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';

const mockLoadedMessages = new Map<string, unknown>();

jest.mock('../../../../../stores', () => ({
	Messages: {
		use: (selector: (state: { get: (id: string) => unknown }) => unknown) => selector({ get: (id) => mockLoadedMessages.get(id) }),
	},
}));

jest.mock('../../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({
	setMessageJumpQueryStringParameter: jest.fn(),
}));

const hit = (overrides: Partial<E2EESearchHit> = {}): E2EESearchHit => ({
	id: 'm1',
	rid: 'r1',
	ts: Date.UTC(2026, 9, 26, 12),
	snippet: 'the <mark>needle</mark>',
	uid: 'u1',
	username: 'alice',
	...overrides,
});

const navigate = jest.fn();

const renderResults = (
	hits: E2EESearchHit[],
	{
		showUserAvatar = true,
		useRealName = false,
		onEndReached,
	}: { showUserAvatar?: boolean; useRealName?: boolean; onEndReached?: () => void } = {},
) =>
	render(<LocalMessageSearchResults id='results' hits={hits} showUserAvatar={showUserAvatar} onEndReached={onEndReached} />, {
		wrapper: mockAppRoot()
			.withSetting('UI_Use_Real_Name', useRealName)
			.withRouter({
				navigate,
				getRouteName: () => 'group',
				getRouteParameters: () => ({ name: 'secret', tab: 'search' }),
				getSearchParameters: () => ({}),
			})
			.build(),
	});

afterEach(() => {
	mockLoadedMessages.clear();
	jest.clearAllMocks();
});

describe('LocalMessageSearchResults', () => {
	it('shows the author name and avatar of each hit', () => {
		renderResults([hit({ uid: 'u1', username: 'alice' })]);

		expect(screen.getByText('alice')).toBeInTheDocument();
		expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('data-username', 'alice');
	});

	it('shows the real name of the author when the client has the message and the workspace uses real names', () => {
		mockLoadedMessages.set('m1', { _id: 'm1', u: { _id: 'u1', username: 'alice', name: 'Alice Doe' } });

		renderResults([hit({ uid: 'u1', username: 'alice' })], { useRealName: true });

		expect(screen.getByText('Alice Doe')).toBeInTheDocument();
	});

	it('does not show the avatar when the user turned avatars off', () => {
		renderResults([hit({ uid: 'u1', username: 'alice' })], { showUserAvatar: false });

		expect(screen.getByText('alice')).toBeInTheDocument();
		expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
	});

	it('shows the caption and the file name of a file hit on separate lines, as the server result does', () => {
		renderResults([hit({ username: 'alice', snippet: 'Q3 <mark>budget</mark> draft\nbudget-2026.pdf' })]);

		const line = (text: string) => screen.getByText((_content, element) => element?.tagName === 'DIV' && element.textContent === text);

		expect(line('Q3 budget draft')).toBeInTheDocument();
		expect(line('budget-2026.pdf')).toBeInTheDocument();
		expect(screen.getByText('budget').tagName).toBe('MARK');
	});

	it('opens the thread of a thread reply and jumps to the reply', async () => {
		renderResults([hit({ id: 'reply1', tmid: 'main1', username: 'alice' })]);

		await userEvent.click(screen.getByText('needle'));

		expect(navigate).toHaveBeenCalledWith(
			{
				name: 'group',
				params: { rid: 'r1', name: 'secret', tab: 'thread', context: 'main1' },
				search: { msg: 'reply1' },
			},
			{ replace: false },
		);
		expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
	});

	it('jumps in the room to a message that is not in a thread, also when it is out of view', async () => {
		renderResults([hit({ id: 'm9', username: 'alice' })]);

		await userEvent.click(screen.getByText('needle'));

		expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith('m9');
		expect(navigate).not.toHaveBeenCalled();
	});

	describe('when the panel resizes', () => {
		const observers: { callback: () => void }[] = [];
		const { ResizeObserver: originalResizeObserver } = globalThis;

		beforeEach(() => {
			globalThis.ResizeObserver = jest.fn((callback: () => void) => {
				observers.push({ callback });
				return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
			}) as unknown as typeof ResizeObserver;
		});

		afterEach(() => {
			observers.splice(0);
			globalThis.ResizeObserver = originalResizeObserver;
			jest.restoreAllMocks();
		});

		it('loads the next hits when a resize leaves the list with nothing to scroll', () => {
			let clientHeight = 300;
			jest.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(1000);
			jest.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(() => clientHeight);
			const onEndReached = jest.fn();
			renderResults([hit()], { onEndReached });

			// The first observation reports the size that the render already checked.
			observers.at(-1)?.callback();
			expect(onEndReached).not.toHaveBeenCalled();

			clientHeight = 900;
			observers.at(-1)?.callback();
			expect(onEndReached).toHaveBeenCalledTimes(1);
		});
	});

	it('opens the hit with the keyboard', async () => {
		renderResults([hit({ id: 'm9', username: 'alice' })]);

		await userEvent.tab();
		await userEvent.keyboard('{Enter}');

		expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith('m9');
	});
});
