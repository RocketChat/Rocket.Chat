import { before, beforeEach, describe, it, mock } from 'node:test';

import * as coreServices from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const modelsMock = {
	Nps: {
		findOne: sinon.stub(),
		save: sinon.stub(),
	},
};

const servicesMock = {
	Banner: {
		create: sinon.stub(),
	},
	Settings: {
		get: sinon.stub(),
	},
};

const getbannerforadminsMock = sinon.stub();

let NPSService: any;

before(async () => {
	mock.module('@rocket.chat/core-services', { exports: { ...coreServices, ...servicesMock } });
	mock.module('./sendNpsResults', { exports: { sendNpsResults: sinon.stub() } });
	mock.module('../../lib/logger/system', { exports: { SystemLogger: { error: sinon.stub() } } });
	mock.module('./notification', { exports: { notifyAdmins: sinon.stub(), getBannerForAdmins: getbannerforadminsMock } });
	({ NPSService } = await import('./service'));
});

describe('NPS Service', () => {
	before(() => {
		mockModel('Nps', modelsMock.Nps);
	});

	it('should instantiate properly', () => {
		expect(new NPSService()).to.be.an('object');
	});

	describe('@create', () => {
		beforeEach(() => {
			servicesMock.Settings.get.reset();
			modelsMock.Nps.findOne.reset();
			modelsMock.Nps.save.reset();
			servicesMock.Banner.create.reset();
			getbannerforadminsMock.reset();
		});
		it('should fail when user opted out of nps', async () => {
			servicesMock.Settings.get.withArgs('NPS_survey_enabled').resolves(false);

			await expect(new NPSService().create({})).to.be.rejectedWith('Server opted-out for NPS surveys');
		});
		it('should fail when nps expireDate is less than nps startAt', async () => {
			servicesMock.Settings.get.withArgs('NPS_survey_enabled').resolves(true);
			modelsMock.Nps.findOne.resolves(null);

			await expect(new NPSService().create({ expireAt: new Date('2020-01-01'), startAt: new Date('2020-01-02') })).to.be.rejectedWith(
				'NPS already expired',
			);
		});
		it('should fail when expireDate is less than current date', async () => {
			servicesMock.Settings.get.withArgs('NPS_survey_enabled').resolves(true);
			modelsMock.Nps.findOne.resolves(null);

			await expect(new NPSService().create({ expireAt: new Date('2020-01-02'), startAt: new Date('2020-01-01') })).to.be.rejectedWith(
				'NPS already expired',
			);
		});
		it('should try to create a banner when theres no nps saved', async () => {
			servicesMock.Settings.get.withArgs('NPS_survey_enabled').resolves(true);
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
			servicesMock.Settings.get.withArgs('NPS_survey_enabled').resolves(true);
			modelsMock.Nps.findOne.resolves({ _id: 'test' });
			modelsMock.Nps.save.rejects();
			await expect(new NPSService().create({})).to.be.rejectedWith('Error creating NPS');
		});
	});
});
