/* eslint-env mocha */

import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createVisitor, createLivechatRoom } from '../../../data/livechat/rooms';
import { updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - Utils', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/offline.message', () => {
		it('should fail if name is not sent as body parameter', async () => {
			const { body } = await request.post(api('livechat/offline.message')).set(credentials).send({});
			expect(body).to.have.property('success', false);
		});
		it('should fail if email is not sent as body parameter', async () => {
			const { body } = await request.post(api('livechat/offline.message')).set(credentials).send({ name: 'test' });
			expect(body).to.have.property('success', false);
		});
		it('should fail if message is not sent as body parameter', async () => {
			await request.post(api('livechat/offline.message')).set(credentials).send({ name: 'test', email: '' }).expect(400);
		});
		it('should fail if setting Livechat_display_offline_form is disabled', async () => {
			await updateSetting('Livechat_display_offline_form', false);
			await request.post(api('livechat/offline.message')).set(credentials).send({ name: 'test', email: '', message: 'test' }).expect(400);
		});
		it('should fail if Livechat_validate_offline_email is enabled and email passed is not resolvable', async () => {
			await updateSetting('Livechat_display_offline_form', true);
			await updateSetting('Livechat_validate_offline_email', true);
			await request
				.post(api('livechat/offline.message'))
				.set(credentials)
				.send({ name: 'test', email: 'test@fadsjfldasjfd.com', message: 'test' })
				.expect(400);
		});
		it('should fail if setting Livechat_offline_email is not setup or is invalid', async () => {
			await updateSetting('Livechat_validate_offline_email', false);
			await request
				.post(api('livechat/offline.message'))
				.set(credentials)
				.send({ name: 'test', email: 'test@email.com', message: 'this is a test :)' })
				.expect(400);
		});
		it('should send an offline email', async () => {
			await updateSetting('Livechat_validate_offline_email', false);
			await updateSetting('Livechat_offline_email', 'test-email@rocket.chat');
			await request
				.post(api('livechat/offline.message'))
				.set(credentials)
				.send({ name: 'test', email: 'test@email.com', message: 'this is a test :)' })
				.expect(200);
		});
	});

	describe('livechat/config', () => {
		it('should return enabled: false if livechat is disabled', async () => {
			await updateSetting('Livechat_enabled', false);
			const { body } = await request.get(api('livechat/config')).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.have.property('enabled', false);
		});
		it('should return basic livechat config when enabled', async () => {
			await updateSetting('Livechat_enabled', true);
			const { body } = await request.get(api('livechat/config')).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.have.property('enabled', true);
			expect(body.config).to.have.property('settings');
			expect(body.config).to.have.property('departments').that.is.an('array');
		});
	});

	describe('livechat/page.visited', () => {
		it('should fail if token is not sent as body param', async () => {
			const { body } = await request.post(api('livechat/page.visited')).set(credentials).send({});
			expect(body).to.have.property('success', false);
		});
		it('should fail if rid is not an string', async () => {
			const { body } = await request.post(api('livechat/page.visited')).set(credentials).send({ token: 'test', rid: {} });
			expect(body).to.have.property('success', false);
		});
		it('should fail if pageInfo is not sent as body param', async () => {
			const { body } = await request.post(api('livechat/page.visited')).set(credentials).send({ token: 'test', rid: 'test' });
			expect(body).to.have.property('success', false);
		});
		it('should fail if pageInfo is not of the right format', async () => {
			const { body } = await request.post(api('livechat/page.visited')).set(credentials).send({ token: 'test', rid: 'test', pageInfo: {} });
			expect(body).to.have.property('success', false);
		});
		it('should return empty if pageInfo.change is not equal to Livechat_history_monitor_type', async () => {
			const { body } = await request
				.post(api('livechat/page.visited'))
				.set(credentials)
				.send({ token: 'test', rid: 'test', pageInfo: { change: 'test', title: 'test', location: { href: 'test' } } });
			expect(body).to.have.property('success', true);
		});
		it('should store values for 1 month if visitor has no room yet', async () => {
			const { body } = await request
				.post(api('livechat/page.visited'))
				.set(credentials)
				.send({ token: 'test', rid: 'test', pageInfo: { change: 'url', title: 'Rocket.Chat', location: { href: 'https://rocket.chat' } } });
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('page');
			expect(body.page).to.have.property('navigation');
			expect(body.page).to.have.property('msg');
		});
		it('should store values correctly on visitor room when room is valid', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request
				.post(api('livechat/page.visited'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: room._id,
					pageInfo: { change: 'url', title: 'Rocket.Chat', location: { href: 'https://rocket.chat' } },
				});

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('page');
			expect(body.page).to.have.property('navigation');
			expect(body.page).to.have.property('msg');
		});
	});
	describe('livechat/transcript', () => {
		it('should fail if token is not in body params', async () => {
			const { body } = await request.post(api('livechat/transcript')).set(credentials).send({});
			expect(body).to.have.property('success', false);
		});
		it('should fail if rid is not in body params', async () => {
			const { body } = await request.post(api('livechat/transcript')).set(credentials).send({ token: 'test' });
			expect(body).to.have.property('success', false);
		});
		it('should fail if email is not in body params', async () => {
			const { body } = await request.post(api('livechat/transcript')).set(credentials).send({ token: 'test', rid: 'test' });
			expect(body).to.have.property('success', false);
		});
		it('should fail if token is not a valid guest token', async () => {
			const { body } = await request.post(api('livechat/transcript')).set(credentials).send({ token: 'test', rid: 'test', email: '' });
			expect(body).to.have.property('success', false);
		});
		it('should fail if rid is not a valid room id', async () => {
			const visitor = await createVisitor();
			const { body } = await request
				.post(api('livechat/transcript'))
				.set(credentials)
				.send({ token: visitor.token, rid: 'test', email: '' });
			expect(body).to.have.property('success', false);
		});
		it('should fail if requesting a transcript of another visitors room', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const visitor2 = await createVisitor();

			const { body } = await request
				.post(api('livechat/transcript'))
				.set(credentials)
				.send({ token: visitor2.token, rid: room._id, email: '' });
			expect(body).to.have.property('success', false);
		});
		it('should fail if email is not a valid email', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request
				.post(api('livechat/transcript'))
				.set(credentials)
				.send({ token: visitor.token, rid: room._id, email: 'test' });
			expect(body).to.have.property('success', false);
		});
		it('should send a transcript if all is good', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request
				.post(api('livechat/transcript'))
				.set(credentials)
				.send({ token: visitor.token, rid: room._id, email: 'visitor@notadomain.com' });
			expect(body).to.have.property('success', true);
		});
	});
});
