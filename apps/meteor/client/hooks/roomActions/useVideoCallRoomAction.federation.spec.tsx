import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useVideoCallRoomAction } from './useVideoCallRoomAction';
import { createFakeRoom } from '../../../tests/mocks/data';

jest.mock('../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning', () => ({
	useVideoConfWarning: () => jest.fn(),
}));

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfStartCall: () => jest.fn(),
	useVideoConfDispatchOutgoing: () => jest.fn(),
	useVideoConfLoadCapabilities: () => jest.fn(),
	useVideoConfIsCalling: () => false,
	useVideoConfIsRinging: () => false,
}));

let room: IRoom;

jest.mock('../../views/room/contexts/RoomContext', () => ({
	useRoom: () => room,
}));

const nativeFederatedRoom = () =>
	createFakeRoom({ t: 'c', federated: true, federation: { version: 1, mrid: '!room:rc2', origin: 'rc2' } } as Partial<IRoom>);

const renderAction = ({ matrixRTC, conferenceWindow }: { matrixRTC: boolean; conferenceWindow: boolean }) =>
	renderHook(() => useVideoCallRoomAction(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withPermission('call-management')
			.withSetting('VideoConf_Conference_Window_Enabled', conferenceWindow)
			.withSetting('Federation_Service_MatrixRTC_Enabled', matrixRTC)
			.build(),
	});

it('offers a call in a native federated room when MatrixRTC calls run in the call window', () => {
	room = nativeFederatedRoom();

	const { result } = renderAction({ matrixRTC: true, conferenceWindow: true });

	expect(result.current?.disabled).toBeFalsy();
});

it.each([
	['MatrixRTC calls are off', { matrixRTC: false, conferenceWindow: true }],
	// Only the call window joins a MatrixRTC session; a provider's own page knows nothing of the other servers.
	['calls do not run in the call window', { matrixRTC: true, conferenceWindow: false }],
])('keeps the call unavailable in a native federated room when %s', (_, settings) => {
	room = nativeFederatedRoom();

	const { result } = renderAction(settings);

	expect(result.current?.disabled).toBe(true);
});

// MatrixRTC is the only way a call crosses servers, and a federated room that is not a Matrix room has none.
it('keeps the call unavailable in a federated room that is not a native one', () => {
	room = createFakeRoom({ t: 'c', federated: true } as Partial<IRoom>);

	const { result } = renderAction({ matrixRTC: true, conferenceWindow: true });

	expect(result.current?.disabled).toBe(true);
});

it('leaves rooms outside federation as they were', () => {
	room = createFakeRoom({ t: 'c' });

	const { result } = renderAction({ matrixRTC: false, conferenceWindow: true });

	expect(result.current?.disabled).toBeFalsy();
});
