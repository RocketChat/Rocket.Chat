import proxyquire from 'proxyquire';
import { expect } from 'chai';
import sinon from 'sinon';

const get = sinon.stub();

const { getMatrixFederationStatistics } = proxyquire
	.noCallThru()
	.load('../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/statistics', {
		'../../../../settings/server': {
			settings: {
				get,
			},
		},
	});

describe('Federation - Infrastructure - RocketChat - Statistics', () => {
	describe('#getMatrixFederationStatistics()', () => {
		const props: any = {
			Federation_Matrix_enabled: true,
		};
		get.callsFake((key) => props[key]);
		it('should return all matrix federation statistics metrics related', async () => {
			expect(await getMatrixFederationStatistics()).to.be.eql({
				enabled: props.Federation_Matrix_enabled,
			});
		});
	});
});
