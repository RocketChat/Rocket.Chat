import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { RenderToolboxItemParams, RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useVideoCallRoomAction } from './useVideoCallRoomAction';
import { createFakeRoom } from '../../../tests/mocks/data';

const startCall = jest.fn();
const dispatchOutgoing = jest.fn();
const loadCapabilities = jest.fn(() => Promise.resolve());
const dispatchWarning = jest.fn();

jest.mock('../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning', () => ({
	useVideoConfWarning: () => dispatchWarning,
}));

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfStartCall: () => startCall,
	useVideoConfDispatchOutgoing: () => dispatchOutgoing,
	useVideoConfLoadCapabilities: () => loadCapabilities,
	useVideoConfIsCalling: () => false,
	useVideoConfIsRinging: () => false,
}));

let fakeRoom = createFakeRoom({ t: 'c' });
let subscribed = true;

jest.mock('../../views/room/contexts/RoomContext', () => ({
	useRoom: () => fakeRoom,
	useUserIsSubscribed: () => subscribed,
}));

type Capabilities = { embedded?: boolean };

type RenderActionOptions = {
	/** What the provider answers when asked for its capabilities; a function to control how. */
	capabilities?: Capabilities | (() => Promise<{ capabilities: Capabilities }>);
	callManagement?: boolean;
	callGroupsEnabled?: boolean;
};

const NATIVE = { embedded: true };

const renderWrapper = (
	conferenceWindowEnabled: boolean,
	{ capabilities, callManagement = true, callGroupsEnabled = true }: RenderActionOptions = {},
) => {
	const getCapabilities = jest.fn(
		typeof capabilities === 'function'
			? capabilities
			: () =>
					capabilities
						? Promise.resolve({ capabilities })
						: Promise.reject({ success: false, error: 'error-videoconf-provider-not-configured' }),
	);
	const dispatchToast = jest.fn();

	const builder = mockAppRoot()
		.withJohnDoe()
		.withToastMessageDispatch(dispatchToast)
		.withSetting('VideoConf_Conference_Window_Enabled', conferenceWindowEnabled)
		.withEndpoint('GET', '/v1/video-conference.capabilities', getCapabilities as any)
		.withEndpoint('GET', '/v1/video-conference.rooms.list', async () => ({ rooms: [] }));

	if (callManagement) {
		builder.withPermission('call-management');
	}

	if (!callGroupsEnabled) {
		builder
			.withSetting('VideoConf_Enable_DMs', false)
			.withSetting('VideoConf_Enable_Channels', false)
			.withSetting('VideoConf_Enable_Teams', false)
			.withSetting('VideoConf_Enable_Groups', false)
			.withSetting('Omnichannel_call_provider', 'none');
	}

	return { wrapper: builder.build(), getCapabilities, dispatchToast };
};

const renderAction = (conferenceWindowEnabled: boolean, options?: RenderActionOptions) => {
	const { wrapper, ...mocks } = renderWrapper(conferenceWindowEnabled, options);
	return { ...renderHook(() => useVideoCallRoomAction(), { wrapper }), ...mocks, wrapper };
};

const renderNativeAction = async (options?: RenderActionOptions) => {
	const view = renderAction(true, { capabilities: NATIVE, ...options });
	await waitFor(() => expect(view.result.current?.renderToolboxItem).toBeDefined());
	return view;
};

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

// The object the base returned: these keys, no others.
const TODAY_KEYS = ['action', 'disabled', 'featured', 'groups', 'icon', 'id', 'order', 'title', 'tooltip'];

const expectTodaysAction = (action: RoomToolboxActionConfig | undefined) => {
	expect(Object.keys(action ?? {}).sort()).toEqual(TODAY_KEYS);
	expect(action).toMatchObject({ id: 'start-video-call', title: 'Video_call', icon: 'video', featured: true, order: 1 });
	expect(action?.action).toEqual(expect.any(Function));
};

const renderToolboxItem = (action: RoomToolboxActionConfig | undefined, wrapper: ReturnType<typeof renderWrapper>['wrapper']) =>
	render(
		<>
			{action?.renderToolboxItem?.({
				...action,
				action: action.action ?? (() => undefined),
				className: 'toolbox-item',
				toolbox: {} as RenderToolboxItemParams['toolbox'],
			})}
		</>,
		{ wrapper },
	);

const openMenu = async () => {
	await userEvent.click(screen.getByRole('button', { name: 'Video_call' }));
	return screen.findByRole('menu');
};

beforeEach(() => {
	fakeRoom = createFakeRoom({ t: 'c' });
	subscribed = true;
	startCall.mockClear();
	dispatchOutgoing.mockClear();
	dispatchWarning.mockClear();
	loadCapabilities.mockReset();
	loadCapabilities.mockImplementation(() => Promise.resolve());
});

// The call window asks how to arrive before it starts anything, so a popup asking the same thing first is one
// confirmation too many.
it('opens the call window straight away when it will ask for itself', async () => {
	const { result } = renderAction(true);

	await act(() => result.current?.action?.());

	expect(startCall).toHaveBeenCalledWith(fakeRoom._id);
	expect(dispatchOutgoing).not.toHaveBeenCalled();
});

// Without a preflight, the popup is still where mic and camera are chosen.
it('asks in the room when there is no call window to ask', async () => {
	const { result } = renderAction(false);

	await act(() => result.current?.action?.());

	expect(dispatchOutgoing).toHaveBeenCalledWith({ rid: fakeRoom._id });
	expect(startCall).not.toHaveBeenCalled();
});

// Whatever opens, the provider being unavailable has to surface before a window does.
it('checks the provider first either way', async () => {
	const { result } = renderAction(true);

	await act(() => result.current?.action?.());

	expect(loadCapabilities).toHaveBeenCalled();
});

// The point of checking first: a provider that isn't there has to be said out loud, and nothing may open on top
// of the answer — an empty call window is a worse way to learn the provider is misconfigured.
it.each([true, false])('says so and opens nothing when the provider is unavailable (call window: %s)', async (windowEnabled) => {
	loadCapabilities.mockRejectedValueOnce({ error: 'error-videoconf-provider-not-configured' });

	const { result } = renderAction(windowEnabled);

	await act(() => result.current?.action?.());

	expect(dispatchWarning).toHaveBeenCalledWith('error-videoconf-provider-not-configured');
	expect(startCall).not.toHaveBeenCalled();
	expect(dispatchOutgoing).not.toHaveBeenCalled();
});

// A channel open as a preview, before joining it, can't hold a call this user starts: the button says to join first
// rather than opening a call that fails.
it.each([false, true])('asks the user to join first in a room they have not joined (native: %s)', async (native) => {
	subscribed = false;

	const { result } = native ? await renderNativeAction() : renderAction(true);

	expect(result.current?.disabled).toBe(true);
	expect(result.current?.tooltip).toBe('Join_the_room_to_start_a_call');
});

it('offers the call in a room the user has joined', () => {
	const { result } = renderAction(true);

	expect(result.current?.disabled).toBeFalsy();
	expect(result.current?.tooltip).toBeUndefined();
});

// Joining would not help in a room that can't hold a call at all, so that is what it says.
it.each([false, true])(
	'says the room cannot hold a call, rather than to join, when joining would not help (native: %s)',
	async (native) => {
		subscribed = false;
		fakeRoom = createFakeRoom({ t: 'c', archived: true });

		const { result } = native ? await renderNativeAction() : renderAction(true);

		expect(result.current?.disabled).toBe(true);
		expect(result.current?.tooltip).not.toBe('Join_the_room_to_start_a_call');
	},
);

// Agents serve an omnichannel room without having joined it.
it.each([false, true])('does not ask an agent to join an omnichannel room (native: %s)', async (native) => {
	subscribed = false;
	fakeRoom = createFakeRoom({ t: 'l' });

	const { result } = native ? await renderNativeAction() : renderAction(true);

	expect(result.current).toBeDefined();
	expect(result.current?.tooltip).not.toBe('Join_the_room_to_start_a_call');
});

describe('without the native provider', () => {
	it("returns today's action when the call window is off", async () => {
		const { result } = renderAction(false, { capabilities: NATIVE });
		await settle();

		expectTodaysAction(result.current);
		expect(result.current).toMatchObject({ disabled: false, tooltip: undefined });

		const { result: withoutPermission } = renderAction(false, { capabilities: NATIVE, callManagement: false });
		await settle();

		expect(withoutPermission.current).toBeUndefined();
	});

	it('asks the provider for nothing when the call window is off', async () => {
		const { getCapabilities } = renderAction(false, { capabilities: NATIVE });
		await settle();

		expect(getCapabilities).not.toHaveBeenCalled();
	});

	it.each([[{}], [{ embedded: false }]])("returns today's action when the provider is not embedded (%j)", async (capabilities) => {
		const { result, getCapabilities } = renderAction(true, { capabilities });
		await waitFor(() => expect(getCapabilities).toHaveBeenCalled());
		await settle();

		expectTodaysAction(result.current);

		const { result: withoutPermission } = renderAction(true, { capabilities, callManagement: false });
		await settle();

		expect(withoutPermission.current).toBeUndefined();
	});

	it("keeps today's action until the provider is known", async () => {
		const { result, getCapabilities } = renderAction(true, { capabilities: () => new Promise(() => undefined) });
		await waitFor(() => expect(getCapabilities).toHaveBeenCalled());

		expectTodaysAction(result.current);
	});

	// No provider configured is reported when the user tries to start a call, not when the header shows.
	it("keeps today's action when the capabilities cannot be read", async () => {
		const { result, getCapabilities, dispatchToast } = renderAction(true);
		await waitFor(() => expect(getCapabilities).toHaveBeenCalled());
		await settle();

		expectTodaysAction(result.current);
		expect(dispatchWarning).not.toHaveBeenCalled();
		expect(dispatchToast).not.toHaveBeenCalled();
		expect(getCapabilities).toHaveBeenCalledTimes(1);
	});
});

describe('with the native provider', () => {
	const expectMenuItem = (action: RoomToolboxActionConfig | undefined) => {
		expect(action).toMatchObject({ id: 'start-video-call', title: 'Video_call', icon: 'video', featured: true, order: 1 });
		expect(action?.renderToolboxItem).toEqual(expect.any(Function));
	};

	// Members who may not start a call still need the room's links.
	it('returns the menu item to a member without call-management', async () => {
		const { result } = await renderNativeAction({ callManagement: false });

		expectMenuItem(result.current);
		expect(result.current).toMatchObject({ disabled: false, tooltip: undefined });
	});

	it('returns the menu item to a muted member', async () => {
		fakeRoom = createFakeRoom({ t: 'c', muted: ['john.doe'] });

		const { result } = await renderNativeAction();

		expect(result.current?.action).toBeUndefined();
		expectMenuItem(result.current);
	});

	it('returns the menu item in a room of one', async () => {
		fakeRoom = createFakeRoom({ t: 'd', uids: ['john.doe-id'] });

		const { result } = await renderNativeAction();

		expect(result.current?.action).toBeUndefined();
		expectMenuItem(result.current);
	});

	it('returns nothing when no call group is enabled', async () => {
		const { result } = renderAction(true, { capabilities: NATIVE, callGroupsEnabled: false });
		await settle();

		expect(result.current).toBeUndefined();
	});

	it('keeps the flat start action for someone who may start', async () => {
		const { result } = await renderNativeAction();

		await act(() => result.current?.action?.());

		expect(startCall).toHaveBeenCalledWith(fakeRoom._id);
	});

	// The overflow menu would otherwise offer a start this user may not make.
	it('has no flat start action for someone who may not', async () => {
		const { result } = await renderNativeAction({ callManagement: false });

		expect(result.current?.action).toBeUndefined();
		expect(result.current?.renderToolboxItem).toEqual(expect.any(Function));
	});

	it('renders a Video_call button that opens the menu', async () => {
		const { result, wrapper } = await renderNativeAction();

		renderToolboxItem(result.current, wrapper);

		expect(screen.getByRole('button', { name: 'Video_call' })).toHaveClass('toolbox-item');
		await openMenu();
		expect(screen.getByRole('menuitem', { name: 'Start_conference' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Create_link' })).toBeInTheDocument();
	});

	it('leaves the button enabled where starting is refused and disables Start conference and Create link', async () => {
		subscribed = false;
		const { result, wrapper } = await renderNativeAction();
		expect(result.current?.disabled).toBe(true);

		renderToolboxItem(result.current, wrapper);

		expect(screen.getByRole('button', { name: 'Video_call' })).toBeEnabled();
		await openMenu();
		expect(screen.getByRole('menuitem', { name: 'Start_conference' })).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getByRole('menuitem', { name: 'Create_link' })).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getAllByTitle('Join_the_room_to_start_a_call')).toHaveLength(2);
	});

	it('starts a conference from the menu the way the toolbar action did', async () => {
		const { result, wrapper } = await renderNativeAction();
		renderToolboxItem(result.current, wrapper);

		await openMenu();
		await userEvent.click(screen.getByRole('menuitem', { name: 'Start_conference' }));

		await waitFor(() => expect(startCall).toHaveBeenCalledWith(fakeRoom._id));
		expect(loadCapabilities).toHaveBeenCalled();
		expect(dispatchOutgoing).not.toHaveBeenCalled();
	});

	it('says so and opens nothing from the menu when the provider is unavailable', async () => {
		loadCapabilities.mockRejectedValueOnce({ error: 'error-videoconf-provider-not-configured' });
		const { result, wrapper } = await renderNativeAction();
		renderToolboxItem(result.current, wrapper);

		await openMenu();
		await userEvent.click(screen.getByRole('menuitem', { name: 'Start_conference' }));

		await waitFor(() => expect(dispatchWarning).toHaveBeenCalledWith('error-videoconf-provider-not-configured'));
		expect(startCall).not.toHaveBeenCalled();
	});

	it("reads the provider's capabilities once when the header mounts", async () => {
		const { getCapabilities, rerender } = await renderNativeAction();

		rerender();
		await settle();

		expect(getCapabilities).toHaveBeenCalledTimes(1);
	});

	it('does not read them when no call group is visible', async () => {
		const { getCapabilities } = renderAction(true, { capabilities: NATIVE, callGroupsEnabled: false });
		await settle();

		expect(getCapabilities).not.toHaveBeenCalled();
	});
});
