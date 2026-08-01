import { hasJoinedVideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { VIDEO_CONF_RINGING_LIMIT, shouldRingVideoConference } from '../../../../lib/videoConference/constants';

describe('hasJoinedVideoConference', () => {
	it('should treat an explicitly joined member as joined', () => {
		expect(hasJoinedVideoConference({ joined: true })).to.be.true;
	});

	it('should treat a member who has not joined as not joined', () => {
		expect(hasJoinedVideoConference({ joined: false })).to.be.false;
	});

	// `users[]` entries were only ever written on join before membership existed, so anything without the
	// flag is historical data describing someone who did join. Reading those as "not joined" would make every
	// past conference look empty.
	it('should treat an entry predating the flag as joined', () => {
		expect(hasJoinedVideoConference({})).to.be.true;
		expect(hasJoinedVideoConference({ joined: undefined })).to.be.true;
	});
});

describe('shouldRingVideoConference', () => {
	it('should ring a list at the limit', () => {
		expect(shouldRingVideoConference(VIDEO_CONF_RINGING_LIMIT)).to.be.true;
	});

	it('should not ring a list over the limit', () => {
		expect(shouldRingVideoConference(VIDEO_CONF_RINGING_LIMIT + 1)).to.be.false;
	});

	it('should ring a small list', () => {
		expect(shouldRingVideoConference(1)).to.be.true;
	});

	// Nobody to ring is not the same as a list small enough to ring — it saves a pointless broadcast when a
	// conference starts in an empty room, or when every user in an add was already a member.
	it('should not ring an empty list', () => {
		expect(shouldRingVideoConference(0)).to.be.false;
	});
});
