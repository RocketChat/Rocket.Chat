import type { ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { isSameChannel } from '../../../../../app/livechat/lib/isSameChannel';

const association = ({
	visitorId = 'visitor-1',
	type = OmnichannelSourceType.WIDGET,
	id,
}: {
	visitorId?: string;
	type?: OmnichannelSourceType;
	id?: string;
} = {}): ILivechatContactVisitorAssociation => ({
	visitorId,
	source: id === undefined ? { type } : { type, id },
});

const missing = (value: null | undefined) => value as unknown as ILivechatContactVisitorAssociation;

describe('isSameChannel', () => {
	describe('missing associations', () => {
		it('should return false when the first association is null or undefined', () => {
			expect(isSameChannel(missing(null), association())).to.be.false;
			expect(isSameChannel(missing(undefined), association())).to.be.false;
		});

		it('should return false when the second association is null or undefined', () => {
			expect(isSameChannel(association(), missing(null))).to.be.false;
			expect(isSameChannel(association(), missing(undefined))).to.be.false;
		});

		it('should return false when both associations are absent', () => {
			expect(isSameChannel(missing(null), missing(null))).to.be.false;
			expect(isSameChannel(missing(undefined), missing(undefined))).to.be.false;
			expect(isSameChannel(missing(null), missing(undefined))).to.be.false;
		});
	});

	describe('visitor and source type', () => {
		it('should return false when visitor ids differ', () => {
			expect(isSameChannel(association({ visitorId: 'visitor-1' }), association({ visitorId: 'visitor-2' }))).to.be.false;
		});

		it('should return false when visitor ids match but source types differ', () => {
			expect(isSameChannel(association({ type: OmnichannelSourceType.WIDGET }), association({ type: OmnichannelSourceType.SMS }))).to.be
				.false;
		});

		it('should return false when visitor ids and source ids match but source types differ', () => {
			expect(
				isSameChannel(
					association({ type: OmnichannelSourceType.APP, id: 'source-1' }),
					association({ type: OmnichannelSourceType.API, id: 'source-1' }),
				),
			).to.be.false;
		});
	});

	describe('source ids', () => {
		it('should return true when visitor ids and source types match and neither has a source id', () => {
			expect(isSameChannel(association(), association())).to.be.true;
		});

		it('should return false when nonempty source ids differ', () => {
			expect(isSameChannel(association({ id: 'source-1' }), association({ id: 'source-2' }))).to.be.false;
		});

		it('should return false when only one association has a source id, in either argument order', () => {
			expect(isSameChannel(association({ id: 'source-1' }), association())).to.be.false;
			expect(isSameChannel(association(), association({ id: 'source-1' }))).to.be.false;
		});

		it('should treat an empty source id the same as a missing one', () => {
			expect(isSameChannel(association({ id: '' }), association())).to.be.true;
			expect(isSameChannel(association(), association({ id: '' }))).to.be.true;
			expect(isSameChannel(association({ id: '' }), association({ id: 'source-1' }))).to.be.false;
		});

		it('should return true for separate associations with matching visitor ids, source types and source ids', () => {
			const first = association({ type: OmnichannelSourceType.APP, id: 'source-1' });
			const second = association({ type: OmnichannelSourceType.APP, id: 'source-1' });

			expect(isSameChannel(first, second)).to.be.true;
		});
	});
});
