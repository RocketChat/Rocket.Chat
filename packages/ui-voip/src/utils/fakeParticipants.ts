import type { RemoteParticipantInfo } from '../context/MediaCallViewContext';

// Pool of names for fake tiles — kept generic and short so the label pill
// in CallTile doesn't truncate. Cycled with a numeric suffix once exhausted.
const FAKE_NAMES = [
	'Alice',
	'Bob',
	'Carol',
	'Dave',
	'Eve',
	'Frank',
	'Grace',
	'Heidi',
	'Ivan',
	'Judy',
	'Mallory',
	'Niaj',
	'Olivia',
	'Peggy',
	'Sybil',
	'Trent',
	'Victor',
	'Walter',
	'Xena',
	'Yves',
	'Zane',
];

/**
 * Build N synthetic `RemoteParticipantInfo` entries for testing the call
 * grid at various counts and viewport proportions. They have no media
 * streams (so the CallTile renders its avatar fallback), and randomly
 * cycle mute state for a more realistic look.
 */
export const buildFakeParticipants = (count: number): RemoteParticipantInfo[] => {
	if (count <= 0) return [];
	const result: RemoteParticipantInfo[] = [];
	for (let i = 0; i < count; i++) {
		const baseName = FAKE_NAMES[i % FAKE_NAMES.length];
		const displayName = i < FAKE_NAMES.length ? baseName : `${baseName} ${Math.floor(i / FAKE_NAMES.length) + 1}`;
		result.push({
			id: `fake-${i}`,
			displayName,
			avatarUrl: undefined,
			muted: i % 3 === 0,
			held: false,
			cameraStream: undefined,
			screenStream: undefined,
			audioStream: undefined,
		});
	}
	return result;
};
