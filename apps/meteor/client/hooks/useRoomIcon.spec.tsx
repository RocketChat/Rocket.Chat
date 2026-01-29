import { useRoomIcon } from './useRoomIcon';
import { createFakeRoom } from '../../tests/mocks/data';

const mockRooms = {
	public: createFakeRoom({
		t: 'c',
		name: 'public',
		teamMain: false,
		abacAttributes: undefined,
	}),
	private: createFakeRoom({
		t: 'p',
		name: 'private',
		teamMain: false,
		abacAttributes: undefined,
	}),
	team: createFakeRoom({
		t: 'c',
		name: 'team',
		teamMain: true,
		abacAttributes: undefined,
	}),
	direct: createFakeRoom({
		t: 'd',
		name: 'direct',
		teamMain: false,
		abacAttributes: undefined,
	}),
	directMultiple: createFakeRoom({
		t: 'd',
		name: 'direct-multiple',
		teamMain: false,
		abacAttributes: undefined,
		uids: ['user1', 'user2', 'user3'],
	}),
	federated: createFakeRoom({
		t: 'c',
		name: 'federated',
		teamMain: false,
		abacAttributes: undefined,
		federated: true,
	}),
	abacRoom: createFakeRoom({
		t: 'c',
		name: 'abac-room',
		teamMain: false,
		abacAttributes: [{ _id: 'attr1', name: 'test', values: ['value1'] }],
	}),
	abacTeamRoom: createFakeRoom({
		t: 'c',
		name: 'abac-team-room',
		teamMain: true,
		abacAttributes: [{ _id: 'attr2', name: 'test', values: ['value2'] }],
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
