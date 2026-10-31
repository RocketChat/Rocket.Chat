import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ActionManagerContext, ModalContext, RoomToolboxContext } from '@rocket.chat/ui-contexts';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import type { VideoConfContextValue } from '@rocket.chat/ui-video-conf';
import { act, renderHook } from '@testing-library/react';
import type { ContextType } from 'react';

import { useMessageBlockContextValue } from './useMessageBlockContextValue';

const joinCall = jest.fn();
const setPreferences = jest.fn();
const dispatchOutgoing = jest.fn();
const startCall = jest.fn();
const loadCapabilities = jest.fn();
const emitInteraction = jest.fn();
const openTab = jest.fn();
const preventDefault = jest.fn();
const setModal = jest.fn();

const querySnapshot = (value: boolean) => (): [() => () => void, () => boolean] => [() => () => undefined, () => value];

const renderContext = ({
	isCalling = false,
	isRinging = false,
	conferenceWindowEnabled = false,
}: { isCalling?: boolean; isRinging?: boolean; conferenceWindowEnabled?: boolean } = {}) => {
	const videoConf = {
		conferenceWindowEnabled,
		joinCall,
		setPreferences,
		dispatchOutgoing,
		startCall,
		loadCapabilities,
		queryCalling: querySnapshot(isCalling),
		queryRinging: querySnapshot(isRinging),
	} as unknown as VideoConfContextValue;

	const { result } = renderHook(() => useMessageBlockContextValue('room-id', 'message-id'), {
		wrapper: mockAppRoot()
			.wrap((children) => (
				<VideoConfContext.Provider value={videoConf}>
					<ActionManagerContext.Provider value={{ emitInteraction } as unknown as ContextType<typeof ActionManagerContext>}>
						<ModalContext.Provider value={{ modal: { setModal }, currentModal: { component: null } }}>
							<RoomToolboxContext.Provider value={{ actions: [], openTab, closeTab: jest.fn() }}>{children}</RoomToolboxContext.Provider>
						</ModalContext.Provider>
					</ActionManagerContext.Provider>
				</VideoConfContext.Provider>
			))
			.build(),
	});

	return (appId: string, actionId: string) =>
		act(async () => {
			await result.current.action(
				{ appId, actionId, blockId: 'block-id', value: 'value', viewId: 'view-id' } as never,
				{ preventDefault } as never,
			);
		});
};

describe('useMessageBlockContextValue', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		loadCapabilities.mockResolvedValue(undefined);
	});

	describe('video conference blocks', () => {
		it('should join the call with the microphone on and the camera off', async () => {
			await renderContext()('videoconf-core', 'join');

			expect(preventDefault).toHaveBeenCalled();
			expect(setPreferences).toHaveBeenCalledWith({ mic: true, cam: false });
			expect(joinCall).toHaveBeenCalledWith('block-id');
			expect(emitInteraction).not.toHaveBeenCalled();
		});

		it('should open the outgoing popup to call back', async () => {
			await renderContext()('videoconf-core', 'callBack');

			expect(dispatchOutgoing).toHaveBeenCalledWith({ rid: 'block-id' });
			expect(startCall).not.toHaveBeenCalled();
		});

		it('should start the call directly when the call window is on', async () => {
			await renderContext({ conferenceWindowEnabled: true })('videoconf-core', 'callBack');

			expect(startCall).toHaveBeenCalledWith('block-id');
			expect(dispatchOutgoing).not.toHaveBeenCalled();
		});

		it.each([
			['calling', { isCalling: true }],
			['ringing', { isRinging: true }],
		])('should not call back while the user is %s', async (_state, state) => {
			await renderContext(state)('videoconf-core', 'callBack');

			expect(loadCapabilities).not.toHaveBeenCalled();
			expect(dispatchOutgoing).not.toHaveBeenCalled();
		});

		it('should warn the user and start no call when the provider cannot be loaded', async () => {
			loadCapabilities.mockRejectedValue({ error: 'no-active-video-conf-provider' });

			await renderContext({ conferenceWindowEnabled: true })('videoconf-core', 'callBack');

			expect(setModal).toHaveBeenCalledTimes(1);
			expect(startCall).not.toHaveBeenCalled();
			expect(dispatchOutgoing).not.toHaveBeenCalled();
		});

		it('should pass an unknown action to the app', async () => {
			await renderContext()('videoconf-core', 'other-action');

			expect(emitInteraction).toHaveBeenCalledTimes(1);
		});
	});

	describe('call history blocks', () => {
		it('should open the call history tab', async () => {
			await renderContext()('media-call-core', 'open-history');

			expect(openTab).toHaveBeenCalledWith('media-call-history', 'block-id');
			expect(emitInteraction).not.toHaveBeenCalled();
		});

		it('should pass an unknown action to the app', async () => {
			await renderContext()('media-call-core', 'other-action');

			expect(openTab).not.toHaveBeenCalled();
			expect(emitInteraction).toHaveBeenCalledTimes(1);
		});
	});

	describe('app blocks', () => {
		it('should not treat an app action with a reserved name as a call history action', async () => {
			await renderContext()('app-id', 'open-history');

			expect(openTab).not.toHaveBeenCalled();
			expect(emitInteraction).toHaveBeenCalledTimes(1);
		});

		it('should send the block action to the app with the message as its container', async () => {
			await renderContext()('app-id', 'action-id');

			expect(preventDefault).not.toHaveBeenCalled();
			expect(emitInteraction).toHaveBeenCalledWith('app-id', {
				type: 'blockAction',
				actionId: 'action-id',
				payload: { blockId: 'block-id', value: 'value' },
				container: { type: 'message', id: 'message-id' },
				rid: 'room-id',
				mid: 'message-id',
			});
		});
	});
});
