import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useVideoCallAction } from './useVideoCallAction';
import { createFakeRoom, createFakeSubscription } from '../../../../../../tests/mocks/data';

jest.mock('../../../contextualBar/VideoConference/hooks/useVideoConfWarning', () => ({
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

const carol = { _id: 'carol', username: '@carol:rc2', federated: true };

type Setup = { matrixRTC: boolean; room?: IRoom };

const renderAction = ({ matrixRTC, room }: Setup) => {
	const root = mockAppRoot()
		.withJohnDoe()
		.withPermission('call-management')
		.withPermission('create-d')
		.withSetting('VideoConf_Enable_DMs', true)
		.withSetting('VideoConf_Conference_Window_Enabled', true)
		.withSetting('Federation_Service_MatrixRTC_Enabled', matrixRTC);

	if (room) {
		root.withRoom(room).withSubscription(createFakeSubscription({ rid: room._id, name: carol.username, t: 'd' }));
	}

	return renderHook(() => useVideoCallAction(carol), { wrapper: root.build() });
};

const federatedDM = () =>
	createFakeRoom({ t: 'd', federated: true, federation: { version: 1, mrid: '!dm:rc2', origin: 'rc2' } } as Partial<IRoom>);

describe('with no room yet', () => {
	it('offers to call a federated user when MatrixRTC calls are on', () => {
		const { result } = renderAction({ matrixRTC: true });

		expect(result.current).toBeDefined();
	});

	// Their room would be a federated one, and nothing could carry the call there.
	it('does not offer to call a federated user otherwise', () => {
		const { result } = renderAction({ matrixRTC: false });

		expect(result.current).toBeUndefined();
	});
});

describe('in their direct room', () => {
	it('offers the call where MatrixRTC calls are on', () => {
		const { result } = renderAction({ matrixRTC: true, room: federatedDM() });

		expect(result.current).toBeDefined();
	});

	it('does not offer it otherwise', () => {
		const { result } = renderAction({ matrixRTC: false, room: federatedDM() });

		expect(result.current).toBeUndefined();
	});
});
