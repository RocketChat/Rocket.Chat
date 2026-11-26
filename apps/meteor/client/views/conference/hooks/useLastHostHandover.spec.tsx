import type { IRocketChatDesktop } from '@rocket.chat/desktop-api';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { PluginParticipant, ProviderPluginControls } from '@rocket.chat/ui-conference';
import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useLastHostHandover } from './useLastHostHandover';

const participant = (uuid: string, displayName: string, flags: Partial<PluginParticipant> = {}): PluginParticipant => ({
	uuid,
	displayName,
	isWaiting: false,
	isHost: false,
	isMuted: false,
	isClientMuted: false,
	isCameraMuted: false,
	isPresenting: false,
	isSpotlight: false,
	raisedHand: false,
	can: { control: false, mute: true, disconnect: true, transfer: true, spotlight: true, fecc: false, raiseHand: true, changeLayout: false },
	...flags,
});

const actions: ProviderPluginControls['actions'] = {
	mute: jest.fn(),
	muteVideo: jest.fn(),
	admit: jest.fn(),
	disconnect: jest.fn(),
	spotlight: jest.fn(),
	raiseHand: jest.fn(),
	setRole: jest.fn(),
	dialOut: jest.fn(),
	refreshRoster: jest.fn(),
	leave: jest.fn(),
};

const me = participant('me', 'Me', { isHost: true });
const ann = participant('ann', 'Ann');
const bob = participant('bob', 'Bob');

const render = (participants: PluginParticipant[]) =>
	renderHook(
		(roster: PluginParticipant[]) =>
			useLastHostHandover({
				features: new Set(['leave', 'set-role']),
				self: { participantUuid: 'me', micMuted: false, camMuted: false, clientMuted: false, isHost: true, canControl: true },
				participants: roster,
				actions,
			}),
		{
			initialProps: participants,
			wrapper: mockAppRoot()
				.withTranslations('en', 'core', {
					Make_host_and_leave: 'Make host and leave',
					Leave_without_a_host: 'Leave without a host',
					Close: 'Close',
					Conference_new_host: 'New host',
				})
				.build(),
		},
	);

/** The candidates sit in a combobox, which lists them only once it is opened. */
const openPicker = async () => {
	await userEvent.click(await screen.findByRole('combobox'));
};

beforeEach(() => {
	jest.clearAllMocks();
});

afterEach(() => {
	jest.useRealTimers();
});

it('offers everyone else in the call who is not already a host or still waiting', async () => {
	const { result } = render([me, ann, participant('carl', 'Carl', { isWaiting: true }), participant('dee', 'Dee', { isHost: true })]);

	act(() => result.current());
	await openPicker();

	expect((await screen.findAllByRole('option')).map((option) => option.textContent)).toEqual(['Ann']);
});

// Leaving while the promotion is still in flight could end the call with nobody in charge of it.
it('promotes the chosen participant and leaves only once the roster shows them as host', async () => {
	const { result, rerender } = render([me, ann, bob]);

	act(() => result.current());
	await openPicker();
	await userEvent.click(await screen.findByRole('option', { name: 'Bob' }));
	await userEvent.click(screen.getByRole('button', { name: 'Make host and leave' }));

	expect(actions.setRole).toHaveBeenCalledWith('bob', 'host');
	expect(actions.leave).not.toHaveBeenCalled();

	rerender([me, ann, { ...bob, isHost: true }]);

	expect(actions.leave).toHaveBeenCalledTimes(1);
});

it('keeps the user in the call when the promotion never shows up', async () => {
	jest.useFakeTimers();
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { result, rerender } = render([me, ann]);

	act(() => result.current());
	await user.click(await screen.findByRole('button', { name: 'Make host and leave' }));

	act(() => jest.advanceTimersByTime(10_000));
	rerender([me, { ...ann, isHost: true }]);

	expect(actions.leave).not.toHaveBeenCalled();
});

it('leaves straight away without a host when asked to', async () => {
	const { result } = render([me, ann]);

	act(() => result.current());
	await userEvent.click(await screen.findByRole('button', { name: 'Leave without a host' }));

	expect(actions.setRole).not.toHaveBeenCalled();
	expect(actions.leave).toHaveBeenCalledTimes(1);
});

it('stays in the call when the user closes the picker', async () => {
	const { result } = render([me, ann]);

	act(() => result.current());
	await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

	expect(actions.setRole).not.toHaveBeenCalled();
	expect(actions.leave).not.toHaveBeenCalled();
});

describe('closing the window', () => {
	const closeWindow = () => {
		const event = new Event('beforeunload', { cancelable: true });
		act(() => {
			window.dispatchEvent(event);
		});
		return event;
	};

	it('asks the browser to hold a last host back, and offers the picker to one who stays', async () => {
		render([me, ann]);

		expect(closeWindow().defaultPrevented).toBe(true);
		expect(await screen.findByRole('button', { name: 'Make host and leave' })).toBeInTheDocument();
	});

	it('lets anyone else go without asking', () => {
		render([me, { ...ann, isHost: true }]);

		expect(closeWindow().defaultPrevented).toBe(false);
	});

	it('lets a host alone in the call go without asking', () => {
		render([me, participant('carl', 'Carl', { isWaiting: true })]);

		expect(closeWindow().defaultPrevented).toBe(false);
	});
});

describe('closing the desktop app call window', () => {
	let closeRequestHandler: (() => boolean) | null = null;
	const setCloseRequestHandler = jest.fn((handler: (() => boolean) | null) => {
		closeRequestHandler = handler;
	});

	beforeEach(() => {
		closeRequestHandler = null;
		window.RocketChatDesktop = { videoCall: { setCloseRequestHandler } } as unknown as IRocketChatDesktop;
	});

	afterEach(() => {
		delete window.RocketChatDesktop;
	});

	const closeWindow = () => {
		let keepOpen: boolean | undefined;
		act(() => {
			keepOpen = closeRequestHandler?.();
		});
		return keepOpen;
	};

	it('keeps the window open for a last host, and shows the picker', async () => {
		render([me, ann]);

		expect(closeWindow()).toBe(true);
		expect(await screen.findByRole('button', { name: 'Make host and leave' })).toBeInTheDocument();
	});

	it('lets anyone else go', () => {
		render([me, { ...ann, isHost: true }]);

		expect(closeWindow()).toBe(false);
	});

	it('lets a host go while their handover is in flight', async () => {
		render([me, ann]);

		closeWindow();
		await userEvent.click(await screen.findByRole('button', { name: 'Make host and leave' }));

		expect(closeWindow()).toBe(false);
	});

	it('removes its handler when the call goes away', () => {
		const { unmount } = render([me, ann]);

		unmount();

		expect(closeRequestHandler).toBeNull();
	});
});
