import type { NPSCreatePayload } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

// Stubs built in `vi.hoisted` so the hoisted `vi.mock` factories can reference them. `sinon.match`
// is cross-instance-sensitive, so we expose the hoisted sinon's `match` and use it in assertions.
const { modelsMock, servicesMock, getbannerforadminsMock, sendNpsResultsMock, systemLoggerErrorMock, notifyAdminsMock, match } = vi.hoisted(
	() => {
		const sinon = require('sinon');
		return {
			match: sinon.match,
			modelsMock: {
				NpsVote: {},
				Nps: {
					findOne: sinon.stub(),
					save: sinon.stub(),
				},
			},
			servicesMock: {
				Banner: {
					create: sinon.stub(),
				},
				Settings: {
					get: sinon.stub(),
				},
			},
			getbannerforadminsMock: sinon.stub(),
			sendNpsResultsMock: sinon.stub(),
			systemLoggerErrorMock: sinon.stub(),
			notifyAdminsMock: sinon.stub(),
		};
	},
);

// `@rocket.chat/models` was proxyquired with `@noCallThru`, so only the listed exports exist.
vi.mock('@rocket.chat/models', () => ({ NpsVote: modelsMock.NpsVote, Nps: modelsMock.Nps }));
// `@rocket.chat/core-services` had NO noCallThru — it fell through to the real module for everything
// except Banner/Settings (so `ServiceClassInternal`, `NPS`, etc. remain real).
vi.mock('@rocket.chat/core-services', async () => {
	const actual = await vi.importActual<any>('@rocket.chat/core-services');
	return { ...actual, Banner: servicesMock.Banner, Settings: servicesMock.Settings };
});
vi.mock('../../../../../server/services/nps/sendNpsResults', () => ({ sendNpsResults: sendNpsResultsMock }));
vi.mock('../../../../../server/lib/logger/system', () => ({ SystemLogger: { error: systemLoggerErrorMock } }));
vi.mock('../../../../../server/services/nps/notification', () => ({
	notifyAdmins: notifyAdminsMock,
	getBannerForAdmins: getbannerforadminsMock,
}));

const { NPSService } = await import('../../../../../server/services/nps/service');

describe('NPS Service', () => {
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

			await expect(new NPSService().create({} as unknown as NPSCreatePayload)).to.be.rejectedWith('Server opted-out for NPS surveys');
		});
		it('should fail when nps expireDate is less than nps startAt', async () => {
			servicesMock.Settings.get.withArgs('NPS_survey_enabled').resolves(true);
			modelsMock.Nps.findOne.resolves(null);

			await expect(
				new NPSService().create({ expireAt: new Date('2020-01-01'), startAt: new Date('2020-01-02') } as unknown as NPSCreatePayload),
			).to.be.rejectedWith('NPS already expired');
		});
		it('should fail when expireDate is less than current date', async () => {
			servicesMock.Settings.get.withArgs('NPS_survey_enabled').resolves(true);
			modelsMock.Nps.findOne.resolves(null);

			await expect(
				new NPSService().create({ expireAt: new Date('2020-01-02'), startAt: new Date('2020-01-01') } as unknown as NPSCreatePayload),
			).to.be.rejectedWith('NPS already expired');
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
					match({
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
			await expect(new NPSService().create({} as unknown as NPSCreatePayload)).to.be.rejectedWith('Error creating NPS');
		});
	});
});
