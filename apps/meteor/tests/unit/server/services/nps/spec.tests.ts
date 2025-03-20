import { expect } from 'chai';
import { describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	'NpsVote': {},
	'Nps': {
		findOne: sinon.stub(),
		save: sinon.stub(),
	},
	'Settings': {
		getValueById: sinon.stub(),
	},
	'@noCallThru': true,
};

const servicesMock = {
	Banner: {
		create: sinon.stub(),
	},
};

const getbannerforadminsMock = sinon.stub();

const { NPSService } = p('../../../../../server/services/nps/service.ts', {
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/core-services': servicesMock,
	'./sendNpsResults': { 'sendNpsResults': sinon.stub(), '@noCallThru': true },
	'../../lib/logger/system': { 'SystemLogger': { error: sinon.stub() }, '@noCallThru': true },
	'./notification': { 'notifyAdmins': sinon.stub(), 'getBannerForAdmins': getbannerforadminsMock, '@noCallThru': true },
});

describe('NPS Service', () => {
	it('should instantiate properly', () => {
		expect(new NPSService()).to.be.an('object');
	});

	describe('@create', () => {
		beforeEach(() => {
			modelsMock.Settings.getValueById.reset();
			modelsMock.Nps.findOne.reset();
			modelsMock.Nps.save.reset();
			servicesMock.Banner.create.reset();
			getbannerforadminsMock.reset();
		});
		it('should fail when user opted out of nps', async () => {
			modelsMock.Settings.getValueById.withArgs('NPS_survey_enabled').resolves(false);

			await expect(new NPSService().create({})).to.be.rejectedWith('Server opted-out for NPS surveys');
		});
		it('should fail when nps expireDate is less than nps startAt', async () => {
			modelsMock.Settings.getValueById.withArgs('NPS_survey_enabled').resolves(true);
			modelsMock.Nps.findOne.resolves(null);

			await expect(new NPSService().create({ expireAt: new Date('2020-01-01'), startAt: new Date('2020-01-02') })).to.be.rejectedWith(
				'NPS already expired',
			);
		});
		it('should fail when expireDate is less than current date', async () => {
			modelsMock.Settings.getValueById.withArgs('NPS_survey_enabled').resolves(true);
			modelsMock.Nps.findOne.resolves(null);

			await expect(new NPSService().create({ expireAt: new Date('2020-01-02'), startAt: new Date('2020-01-01') })).to.be.rejectedWith(
				'NPS already expired',
			);
		});
		it('should try to create a banner when theres no nps saved', async () => {
			modelsMock.Settings.getValueById.withArgs('NPS_survey_enabled').resolves(true);
			modelsMock.Nps.findOne.resolves(null);

			const today = new Date();
			const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

			await new NPSService().create({
				expireAt: tomorrow,
				startAt: today,
				createdBy: { _id: 'tomorrow', username: 'tomorrow' },
				npsId: 'test',
			});
			expect(getbannerforadminsMock.called).to.be.true;
			expect(getbannerforadminsMock.calledWith(tomorrow)).to.be.true;
			expect(modelsMock.Nps.save.called).to.be.true;
			expect(
				modelsMock.Nps.save.calledWith(
					sinon.match({
						expireAt: tomorrow,
						startAt: today,
						status: 'open',
						_id: 'test',
						createdBy: { _id: 'tomorrow', username: 'tomorrow' },
					}),
				),
			).to.be.true;
		});
		it('should fail if theres an error when saving the Nps', async () => {
			modelsMock.Settings.getValueById.withArgs('NPS_survey_enabled').resolves(true);
			modelsMock.Nps.findOne.resolves({ _id: 'test' });
			modelsMock.Nps.save.rejects();
			await expect(new NPSService().create({})).to.be.rejectedWith('Error creating NPS');
		});
	});
});
