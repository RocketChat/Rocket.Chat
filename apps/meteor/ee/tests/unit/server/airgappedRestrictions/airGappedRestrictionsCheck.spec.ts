import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const AirgappedModule = {
	removeRestrictions: sinon.stub(),
	applyRestrictions: sinon.stub(),
	checkRemainingDaysSinceLastStatsReport: sinon.stub(),
};

const LicenseModule = {
	hasModule: sinon.stub(),
};

const StatisticsModule = {
	findLast: sinon.stub(),
};

const cleanStubs = () => {
	Object.values(AirgappedModule).forEach((stub) => stub.resetHistory());
	LicenseModule.hasModule.resetHistory();
	StatisticsModule.findLast.resetHistory();
};

const { checkAirGappedRestrictions } = proxyquire.noCallThru().load('../../../../app/license/server/airGappedRestrictionsCheck.ts', {
	'@rocket.chat/license': {
		AirGappedRestriction: AirgappedModule,
		License: LicenseModule,
	},
	'@rocket.chat/models': {
		Statistics: StatisticsModule,
	},
});

// TODO: remove this test, checkAirGappedRestrictions just fetches the statsToken and passes it to AirGappedRestrictionModule.
describe.skip('#checkAirGappedRestrictions()', () => {
	afterEach(cleanStubs);

	it('should remove any restriction and not to check the validity of the stats token when the workspace has "unlimited-presence" module enabled', async () => {
		LicenseModule.hasModule.returns(true);
		await checkAirGappedRestrictions();
		expect(AirgappedModule.removeRestrictions.calledOnce).to.be.true;
		expect(AirgappedModule.applyRestrictions.notCalled).to.be.true;
		expect(AirgappedModule.checkRemainingDaysSinceLastStatsReport.notCalled).to.be.true;
	});

	it('should apply restrictions right away when the workspace doesnt contain a license with the previous module enabled AND there is no statsToken (no report was made before)', async () => {
		LicenseModule.hasModule.returns(false);
		StatisticsModule.findLast.returns(undefined);
		await checkAirGappedRestrictions();
		expect(AirgappedModule.applyRestrictions.calledOnce).to.be.true;
		expect(AirgappedModule.removeRestrictions.notCalled).to.be.true;
		expect(AirgappedModule.checkRemainingDaysSinceLastStatsReport.notCalled).to.be.true;
	});

	it('should check the statsToken validity if there is no valid license and a report to the cloud was made before', async () => {
		LicenseModule.hasModule.returns(false);
		StatisticsModule.findLast.returns({ statsToken: 'token' });
		await checkAirGappedRestrictions();
		expect(AirgappedModule.applyRestrictions.notCalled).to.be.true;
		expect(AirgappedModule.removeRestrictions.notCalled).to.be.true;
		expect(AirgappedModule.checkRemainingDaysSinceLastStatsReport.calledWith('token')).to.be.true;
	});
});
