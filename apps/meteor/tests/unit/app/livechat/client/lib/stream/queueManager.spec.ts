import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';

const loadMock = (stubs?: Record<string, unknown>) => {
	return proxyquire.noCallThru().load('../../../../../../../app/livechat/client/lib/stream/queueManager', {
		'meteor/meteor': {
			'@global': true,
		},
		'../../../../settings/client': {
			settings: { get: () => 0 },
		},
		'../../../../utils/client': {},
		'../../collections/LivechatInquiry': {},
		'./inquiry': {},
		'../../../../custom-sounds/client/lib/CustomSounds': {},
		...stubs,
	});
};

describe('getQueuedChatsCount', () => {
	it(`should return max incoming 0 and max queued 0 when poolMaxIncoming is 0`, () => {
		const { getQueuedChatsCount } = loadMock();

		const queuedChatsCount = getQueuedChatsCount('');
		expect(queuedChatsCount).to.be.equal(0);
	});

	it(`should return max incoming 1 and when poolMaxIncoming is 1`, () => {
		const { getQueuedChatsCount } = loadMock({
			'../../../../settings/client': {
				settings: { get: () => 1 },
			},
			'../../collections/LivechatInquiry': {
				LivechatInquiry: {
					find: () => {
						return {
							count: () => 1,
						};
					},
				},
			},
		});

		const queuedChatsCount = getQueuedChatsCount('');
		expect(queuedChatsCount).to.be.equal(1);
	});
});

describe('newInquirySound', () => {
	it(`should play song when room notification and agent available`, () => {
		const play = spy();
		const { newInquirySound } = loadMock({
			'../../../../custom-sounds/client/lib/CustomSounds': {
				CustomSounds: {
					play,
				},
			},
			'meteor/meteor': {
				'@global': true,
				'Meteor': {
					user: () => ({ statusLivechat: 'available' }),
				},
			},
			'../../../../utils/client': {
				getUserPreference: () => 'song',
			},
		});

		newInquirySound();
		expect(play).to.have.been.called.exactly(1);
	});

	it(`should not play song when no agent available`, () => {
		const play = spy();
		const { newInquirySound } = loadMock({
			'../../../../custom-sounds/client/lib/CustomSounds': {
				CustomSounds: {
					play,
				},
			},
			'meteor/meteor': {
				'@global': true,
				'Meteor': {
					user: () => ({ statusLivechat: 'unavailable' }),
				},
			},
			'../../../../utils/client': {
				getUserPreference: () => 'song',
			},
		});

		newInquirySound();
		expect(play).to.have.been.called.exactly(0);
	});

	it(`should not play song when room notification is none`, () => {
		const play = spy();
		const { newInquirySound } = loadMock({
			'../../../../custom-sounds/client/lib/CustomSounds': {
				CustomSounds: {
					play,
				},
			},
			'meteor/meteor': {
				'@global': true,
				'Meteor': {
					user: () => ({ statusLivechat: 'available' }),
				},
			},
			'../../../../utils/client': {
				getUserPreference: () => 'none',
			},
		});

		newInquirySound();
		expect(play).to.have.been.called.exactly(0);
	});
});
