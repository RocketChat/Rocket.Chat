import { Meteor } from 'meteor/meteor';

import { installDdpSdkCollectionBridge, trackMeteorLogin } from './ddpSdkCollectionBridge';
import { getDdpSdk } from '../../lib/sdk/ddpSdk';

jest.mock('../../lib/sdk/ddpSdk', () => ({
	getDdpSdk: jest.fn(),
}));

jest.mock('../../lib/sdk/sdkTransportEnabled', () => ({
	isSdkTransportEnabled: () => false,
}));

describe('ddpSdkCollectionBridge', () => {
	let deliver: (frame: Record<string, unknown>) => void;
	const closeSocket = jest.fn();
	const onMeteorMessage = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(Meteor as unknown as { connection: unknown }).connection = { _streamHandlers: { onMessage: onMeteorMessage } };
		jest.mocked(getDdpSdk).mockReturnValue({
			client: {
				ddp: {
					onMessage: (cb: typeof deliver) => {
						deliver = cb;
					},
				},
			},
			connection: { ws: { close: closeSocket } },
		} as unknown as ReturnType<typeof getDdpSdk>);
		installDdpSdkCollectionBridge();
	});

	it('withholds a login failed with 500 from Meteor and drops the socket so Meteor resends it', () => {
		trackMeteorLogin('1');

		deliver({ msg: 'result', id: '1', error: { error: 500, reason: 'Internal server error' } });
		deliver({ msg: 'updated', methods: ['1'] });

		expect(onMeteorMessage).not.toHaveBeenCalled();
		expect(closeSocket).toHaveBeenCalledTimes(1);
	});

	it('forwards a login rejected for the token, so Meteor logs the user out', () => {
		trackMeteorLogin('2');

		deliver({ msg: 'result', id: '2', error: { error: 403, reason: "You've been logged out by the server. Please log in again" } });

		expect(onMeteorMessage).toHaveBeenCalledTimes(1);
		expect(closeSocket).not.toHaveBeenCalled();
	});

	it('forwards a 500 from a method that is not a login', () => {
		deliver({ msg: 'result', id: '3', error: { error: 500 } });

		expect(onMeteorMessage).toHaveBeenCalledTimes(1);
		expect(closeSocket).not.toHaveBeenCalled();
	});
});
