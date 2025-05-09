import { expect } from 'chai';
import proxyquire from 'proxyquire';

const { isVerifiedChannelInSource } = proxyquire.noCallThru().load('./isVerifiedChannelInSource', {});

describe('isVerifiedChannelInSource', () => {
	it('should return false if channel is not verified', () => {
		const channel = {
			verified: false,
		};
		const visitorId = 'visitor1';
		const source = {
			type: 'widget',
		};

		expect(isVerifiedChannelInSource(channel, visitorId, source)).to.be.false;
	});

	it('should return false if channel visitorId is different from visitorId', () => {
		const channel = {
			verified: true,
			visitor: {
				visitorId: 'visitor2',
			},
		};
		const visitorId = 'visitor1';
		const source = {
			type: 'widget',
		};

		expect(isVerifiedChannelInSource(channel, visitorId, source)).to.be.false;
	});

	it('should return false if channel visitor source type is different from source type', () => {
		const channel = {
			verified: true,
			visitor: {
				visitorId: 'visitor1',
				source: {
					type: 'web',
				},
			},
		};
		const visitorId = 'visitor1';
		const source = {
			type: 'widget',
		};

		expect(isVerifiedChannelInSource(channel, visitorId, source)).to.be.false;
	});

	it('should return false if channel visitor source id is different from source id', () => {
		const channel = {
			verified: true,
			visitor: {
				visitorId: 'visitor1',
				source: {
					type: 'widget',
					id: 'source1',
				},
			},
		};
		const visitorId = 'visitor1';
		const source = {
			type: 'widget',
			id: 'source2',
		};

		expect(isVerifiedChannelInSource(channel, visitorId, source)).to.be.false;
	});

	it('should return false if source id is not defined and channel visitor source id is defined', () => {
		const channel = {
			verified: true,
			visitor: {
				visitorId: 'visitor1',
				source: {
					type: 'widget',
					id: 'source1',
				},
			},
		};
		const visitorId = 'visitor1';
		const source = {
			type: 'widget',
		};

		expect(isVerifiedChannelInSource(channel, visitorId, source)).to.be.false;
	});

	it('should return true if all conditions are met', () => {
		const channel = {
			verified: true,
			visitor: {
				visitorId: 'visitor1',
				source: {
					type: 'widget',
					id: 'source1',
				},
			},
		};
		const visitorId = 'visitor1';
		const source = {
			type: 'widget',
			id: 'source1',
		};

		expect(isVerifiedChannelInSource(channel, visitorId, source)).to.be.true;
	});
});
