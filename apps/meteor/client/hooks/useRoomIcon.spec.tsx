import { useRoomIcon } from './useRoomIcon';
import { createFakeRoom } from '../../tests/mocks/data';

const mockRooms = {
	public: createFakeRoom({
		t: 'c',
		name: 'public',
		teamMain: false,
		// @ts-expect-error TODO: Implement ABAC attributes in rooms
		abacAttributes: false,
	}),
	private: createFakeRoom({
		t: 'p',
		name: 'private',
		teamMain: false,
		// @ts-expect-error TODO: Implement ABAC attributes in rooms
		abacAttributes: false,
	}),
	team: createFakeRoom({
		t: 'c',
		name: 'team',
		teamMain: true,
		// @ts-expect-error TODO: Implement ABAC attributes in rooms
		abacAttributes: false,
	}),
	direct: createFakeRoom({
		t: 'd',
		name: 'direct',
		teamMain: false,
		// @ts-expect-error TODO: Implement ABAC attributes in rooms
		abacAttributes: false,
	}),
	directMultiple: createFakeRoom({
		t: 'd',
		name: 'direct-multiple',
		teamMain: false,
		// @ts-expect-error TODO: Implement ABAC attributes in rooms
		abacAttributes: false,
		uids: ['user1', 'user2', 'user3'],
	}),
	federated: createFakeRoom({
		t: 'c',
		name: 'federated',
		teamMain: false,
		// @ts-expect-error TODO: Implement ABAC attributes in rooms
		abacAttributes: false,
		federated: true,
	}),
	abacRoom: createFakeRoom({
		t: 'c',
		name: 'abac-room',
		teamMain: false,
		// @ts-expect-error TODO: Implement ABAC attributes in rooms
		abacAttributes: true,
	}),
	abacTeamRoom: createFakeRoom({
		t: 'c',
		name: 'abac-team-room',
		teamMain: true,
		// @ts-expect-error TODO: Implement ABAC attributes in rooms
		abacAttributes: true,
	}),
};

const expectedResults = {
	public: { name: 'hash' },
	private: { name: 'hashtag-lock' },
	team: { name: 'team' },
	federated: { name: 'globe' },
	abacRoom: { name: 'hash-shield' },
	abacTeamRoom: { name: 'team-shield' },
	direct: { name: 'at' },
	directMultiple: { name: 'balloon' },
};

describe('useRoomIcon', () => {
	it('should return the correct icon for each room', () => {
		Object.entries(mockRooms).forEach(([key, room]) => {
			const result = useRoomIcon(room);
			expect(result).toEqual(expectedResults[key as keyof typeof expectedResults]);
		});
	});
});
