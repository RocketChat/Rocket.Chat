import type { IRoom } from '@rocket.chat/core-typings';

import { getRoomGroup } from './getRoomGroup';

it('should return "direct" for direct message rooms', () => {
	const result = getRoomGroup({ t: 'd' } as IRoom);

	expect(result).toBe('direct');
});

it('should return "team" for team rooms', () => {
	const result = getRoomGroup({ teamMain: true } as IRoom);

	expect(result).toBe('team');
});

it('should return "direct_multiple" for direct message room with many users', () => {
	const result = getRoomGroup({ uids: ['id1', 'id2', 'id3'], t: 'd' } as IRoom);

	expect(result).toBe('direct_multiple');
});
