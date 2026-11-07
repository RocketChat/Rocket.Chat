import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const findRoomsByTypesWithNumberOfMessagesBetweenDateMock = sinon.stub();

const { findChannelsWithNumberOfMessages } = p.noCallThru().load('./channels.ts', {
	'@rocket.chat/models': {
		Analytics: { findRoomsByTypesWithNumberOfMessagesBetweenDate: findRoomsByTypesWithNumberOfMessagesBetweenDateMock },
	},
	'../../../../server/lib/rooms/roomCoordinator': {
		roomCoordinator: { getTypesToShowOnDashboard: () => ['c', 'p', 'd'] },
	},
});

describe('findChannelsWithNumberOfMessages', () => {
	beforeEach(() => {
		findRoomsByTypesWithNumberOfMessagesBetweenDateMock.reset();
		findRoomsByTypesWithNumberOfMessagesBetweenDateMock.returns({ toArray: async () => [] });
	});

	it('compares against a previous period as long as the requested one', async () => {
		await findChannelsWithNumberOfMessages({
			start: new Date(2026, 9, 23, 0, 0, 0, 0),
			end: new Date(2026, 9, 29, 23, 59, 59, 999),
			options: {},
		});

		const { start, end, startOfLastWeek, endOfLastWeek } = findRoomsByTypesWithNumberOfMessagesBetweenDateMock.firstCall.args[0];

		expect({ start, end }).to.deep.equal({ start: 20261023, end: 20261029 });
		expect({ startOfLastWeek, endOfLastWeek }).to.deep.equal({ startOfLastWeek: 20261016, endOfLastWeek: 20261022 });
	});
});
