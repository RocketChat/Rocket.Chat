import { sdk } from './SDKClient';
import { UserAction } from './UserAction';

jest.mock('./SDKClient', () => ({
	sdk: {
		stream: jest.fn(),
		publish: jest.fn(),
	},
}));

jest.mock('./settings', () => ({
	settings: { peek: jest.fn(() => false) },
}));

jest.mock('./user', () => ({
	getUser: jest.fn(() => null),
	getUserId: jest.fn(() => 'user-id'),
}));

jest.mock('../stores', () => ({
	Users: { state: { get: jest.fn() } },
}));

const stream = jest.mocked(sdk.stream);

describe('UserAction.addStream', () => {
	let stop: jest.Mock;

	beforeEach(() => {
		stop = jest.fn();
		stream.mockReset().mockReturnValue({ stop } as unknown as ReturnType<typeof sdk.stream>);
	});

	it('opens one stream per room no matter how many subscribers it has', () => {
		const releaseFirst = UserAction.addStream('room-a');
		const releaseSecond = UserAction.addStream('room-a');

		expect(stream).toHaveBeenCalledTimes(1);
		expect(stream).toHaveBeenCalledWith('notify-room', ['room-a/user-activity'], expect.any(Function));

		releaseFirst();
		releaseSecond();
	});

	it('keeps the stream open until the last subscriber releases it', () => {
		const releaseFirst = UserAction.addStream('room-b');
		const releaseSecond = UserAction.addStream('room-b');

		releaseFirst();
		expect(stop).not.toHaveBeenCalled();

		releaseSecond();
		expect(stop).toHaveBeenCalledTimes(1);
	});

	it('ignores a subscriber releasing twice', () => {
		const releaseFirst = UserAction.addStream('room-c');
		const releaseSecond = UserAction.addStream('room-c');

		releaseFirst();
		releaseFirst();
		expect(stop).not.toHaveBeenCalled();

		releaseSecond();
		expect(stop).toHaveBeenCalledTimes(1);
	});

	it('opens a new stream once a released room is subscribed again', () => {
		UserAction.addStream('room-d')();
		UserAction.addStream('room-d');

		expect(stream).toHaveBeenCalledTimes(2);
	});
});
