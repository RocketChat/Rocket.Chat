import type { IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getRoomGroup } from '../../../../client/views/room/lib/getRoomGroup';

describe('getRoomGroup', () => {
	it('should return "direct" for direct message rooms', () => {
		const result = getRoomGroup({ t: 'd' } as IRoom);

		expect(result).to.be.equal('direct');
	});

	it('should return "team" for team rooms', () => {
		const result = getRoomGroup({ teamMain: true } as IRoom);

		expect(result).to.be.equal('team');
	});

	it('should return "direct_multiple" for direct message room with many users', () => {
		const result = getRoomGroup({ uids: ['id1', 'id2', 'id3'], t: 'd' } as IRoom);

		expect(result).to.be.equal('direct_multiple');
	});
});
