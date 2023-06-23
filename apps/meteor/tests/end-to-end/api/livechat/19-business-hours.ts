/* eslint-env mocha */

import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import moment from 'moment-timezone';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { saveBusinessHour } from '../../../data/livechat/business-hours';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';
import { createAgent } from '../../../data/livechat/rooms';
import { getMe } from '../../../data/users.helper';
import { changeAgentStatus } from '../../../data/livechat/agent';
import { sleep } from '../../../../lib/utils/sleep';

describe('[CE] LIVECHAT - business hours', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
	});

	const formatUtcOffset = (timezone: string) => moment.tz(timezone).format('Z');
	let defaultBhId: string;
	describe('livechat/business-hour', () => {
		it('should fail when user doesnt have view-livechat-business-hours permission', async () => {
			await updatePermission('view-livechat-business-hours', []);
			const response = await request.get(api('livechat/business-hour')).set(credentials).expect(403);
			expect(response.body.success).to.be.false;
		});
		it('should fail when business hour type is not a valid BH type', async () => {
			await updatePermission('view-livechat-business-hours', ['admin', 'livechat-manager']);
			const response = await request.get(api('livechat/business-hour')).set(credentials).query({ type: 'invalid' }).expect(200);
			expect(response.body.success).to.be.true;
			expect(response.body.businessHour).to.be.null;
		});
		it('should return a business hour of type default', async () => {
			const response = await request.get(api('livechat/business-hour')).set(credentials).query({ type: 'default' }).expect(200);
			expect(response.body.success).to.be.true;
			expect(response.body.businessHour).to.be.an('object');
			expect(response.body.businessHour._id).to.be.a('string');
			expect(response.body.businessHour.workHours).to.be.an('array');
			expect(response.body.businessHour.workHours[0]).to.be.an('object');
			expect(response.body.businessHour.workHours[0].day)
				.to.be.an('string')
				.that.is.oneOf(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
			expect(response.body.businessHour.workHours[0].start).to.be.an('object');
			expect(response.body.businessHour.workHours[0].finish).to.be.an('object');
			expect(response.body.businessHour.workHours[0].open).to.be.a('boolean');
			expect(response.body.businessHour.timezone).to.be.an('object').that.has.property('name').that.is.an('string');

			defaultBhId = response.body.businessHour._id;
		});

		it('should start default business hour', async () => {
			const agent = await createAgent();
			const timezone = moment.tz.guess();
			const day = moment.tz(timezone).format('dddd');
			const startHour = moment.tz(timezone).startOf('day').format('HH:mm');
			const closeHour = moment.tz(timezone).endOf('day').format('HH:mm');

			console.log('timezone', timezone);
			console.log('day', day);
			console.log('startHour', startHour);
			console.log('closeHour', closeHour);

			await saveBusinessHour({
				_id: defaultBhId,
				active: true,
				type: LivechatBusinessHourTypes.DEFAULT,
				workHours: [
					{
						day,
						open: true,
						// @ts-expect-error - this is valid for endpoint, actual type converts this into an object
						start: startHour,
						// @ts-expect-error - same as previous one
						finish: closeHour,
					},
				],
				timezone: {
					name: timezone,
					utc: formatUtcOffset(timezone),
				},
				departmentsToApplyBusinessHour: '',
				timezoneName: timezone,
			});

			// BH active, we can toggle our status and get it added to our cache
			await sleep(1000);
			await changeAgentStatus(agent._id, 'available');
			const me = await getMe(credentials);

			expect(me.openBusinessHours).to.be.an('array').with.lengthOf(1);
			expect(me.openBusinessHours[0]).to.be.equal(defaultBhId);
			expect(me.statusLivechat).to.be.equal('available');
		});

		it('should stop default business hour', async () => {
			const timezone = moment.tz.guess();
			const day = moment.tz(timezone).format('dddd');
			const startHour = moment.tz(timezone).startOf('day').format('HH:mm');
			const closeHour = moment.tz(timezone).startOf('day').add(1, 'minute').format('HH:mm');

			await saveBusinessHour({
				_id: defaultBhId,
				active: true,
				type: LivechatBusinessHourTypes.DEFAULT,
				workHours: [
					{
						day,
						open: true,
						// @ts-expect-error - this is valid for endpoint, actual type converts this into an object
						start: startHour,
						// @ts-expect-error - same as previous one
						finish: closeHour,
					},
				],
				timezone: {
					name: timezone,
					utc: formatUtcOffset(timezone),
				},
				departmentsToApplyBusinessHour: '',
				timezoneName: timezone,
			});

			await sleep(1000);
			const me = await getMe(credentials);

			expect(me.openBusinessHours).to.be.an('array').with.lengthOf(0);
			expect(me.statusLivechat).to.be.equal('not-available');
		});
	});

	(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - business hours', () => {
		it('should fail if user doesnt have view-livechat-business-hours permission', async () => {
			await updatePermission('view-livechat-business-hours', []);
			const response = await request.get(api('livechat/business-hours')).set(credentials).expect(403);
			expect(response.body.success).to.be.false;
		});
		it('should return a list of business hours', async () => {
			await updatePermission('view-livechat-business-hours', ['admin', 'livechat-manager']);
			const response = await request.get(api('livechat/business-hours')).set(credentials).expect(200);
			expect(response.body.success).to.be.true;
			expect(response.body.businessHours).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(response.body.businessHours[0]).to.be.an('object');
			expect(response.body.businessHours[0]._id).to.be.a('string');
			expect(response.body.businessHours[0].workHours).to.be.an('array');
			expect(response.body.businessHours[0].workHours[0]).to.be.an('object');
			expect(response.body.businessHours[0].workHours[0].day)
				.to.be.an('string')
				.that.is.oneOf(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
			expect(response.body.businessHours[0].workHours[0].start).to.be.an('object');
			expect(response.body.businessHours[0].workHours[0].finish).to.be.an('object');
			expect(response.body.businessHours[0].workHours[0].open).to.be.a('boolean');
			expect(response.body.businessHours[0].timezone).to.be.an('object').that.has.property('name').that.is.an('string');
			expect(response.body.businessHours[0].active).to.be.a('boolean');
		});
		it('should return a just created custom business hour', async () => {
			const name = `business-hour-${Date.now()}`;
			await updateSetting('Livechat_business_hour_type', 'Multiple');
			await saveBusinessHour({
				name,
				active: true,
				type: LivechatBusinessHourTypes.CUSTOM,
				workHours: [
					{
						day: 'Monday',
						open: true,
						// @ts-expect-error - this is valid for endpoint, actual type converts this into an object
						start: '08:00',
						// @ts-expect-error - same as previous one
						finish: '18:00',
					},
				],
				timezone: {
					name: 'America/Sao_Paulo',
					utc: '-03:00',
				},
				departmentsToApplyBusinessHour: '',
				timezoneName: 'America/Sao_Paulo',
			});

			const { body } = await request.get(api('livechat/business-hours')).set(credentials).query({ name }).expect(200);
			expect(body.success).to.be.true;
			expect(body.businessHours).to.be.an('array').with.lengthOf(1);
			expect(body.businessHours[0]).to.be.an('object');
			expect(body.businessHours[0]._id).to.be.a('string');
			expect(body.businessHours[0]).to.have.property('name', name);
			expect(body.businessHours[0]).to.have.property('active', true);
			expect(body.businessHours[0]).to.have.property('type', LivechatBusinessHourTypes.CUSTOM);
			expect(body.businessHours[0]).to.have.property('workHours').that.is.an('array').with.lengthOf(1);
			expect(body.businessHours[0].workHours[0]).to.be.an('object').with.property('day', 'Monday');
			expect(body.businessHours[0].workHours[0]).to.have.property('start').that.is.an('object');
			expect(body.businessHours[0].workHours[0]).to.have.property('finish').that.is.an('object');
			expect(body.businessHours[0]).to.have.property('timezone').that.is.an('object').with.property('name', 'America/Sao_Paulo');
		});
		it('should fail if start and finish time are the same', async () => {
			const name = `business-hour-${Date.now()}`;
			await updateSetting('Livechat_business_hour_type', 'Multiple');
			const result = await saveBusinessHour({
				name,
				active: true,
				type: LivechatBusinessHourTypes.CUSTOM,
				workHours: [
					{
						day: 'Monday',
						open: true,
						// @ts-expect-error - this is valid for endpoint, actual type converts this into an object
						start: '08:00',
						// @ts-expect-error - same as previous one
						finish: '08:00',
					},
				],
				timezone: {
					name: 'America/Sao_Paulo',
					utc: '-03:00',
				},
				departmentsToApplyBusinessHour: '',
				timezoneName: 'America/Sao_Paulo',
			});

			expect(result).to.have.property('error');
		});
		it('should fail if finish is before start time', async () => {
			const name = `business-hour-${Date.now()}`;
			await updateSetting('Livechat_business_hour_type', 'Multiple');
			const result = await saveBusinessHour({
				name,
				active: true,
				type: LivechatBusinessHourTypes.CUSTOM,
				workHours: [
					{
						day: 'Monday',
						open: true,
						// @ts-expect-error - this is valid for endpoint, actual type converts this into an object
						start: '10:00',
						// @ts-expect-error - same as previous one
						finish: '08:00',
					},
				],
				timezone: {
					name: 'America/Sao_Paulo',
					utc: '-03:00',
				},
				departmentsToApplyBusinessHour: '',
				timezoneName: 'America/Sao_Paulo',
			});

			expect(result).to.have.property('error');
		});
		it('should fail if data is invalid', async () => {
			const name = `business-hour-${Date.now()}`;
			await updateSetting('Livechat_business_hour_type', 'Multiple');
			const result = await saveBusinessHour({
				name,
				active: true,
				type: LivechatBusinessHourTypes.CUSTOM,
				workHours: [
					{
						day: 'Monday',
						open: true,
						// @ts-expect-error - this is valid for endpoint, actual type converts this into an object
						start: '20000',
						// @ts-expect-error - same as previous one
						finish: 'xxxxx',
					},
				],
				timezone: {
					name: 'America/Sao_Paulo',
					utc: '-03:00',
				},
				departmentsToApplyBusinessHour: '',
				timezoneName: 'America/Sao_Paulo',
			});

			expect(result).to.have.property('error');
		});
	});
});
