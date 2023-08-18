import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createCustomField, deleteCustomField } from '../../../data/livechat/custom-fields';
import { addOrRemoveAgentFromDepartment, createDepartmentWithAnOnlineAgent } from '../../../data/livechat/department';
import { createVisitor, createLivechatRoom, makeAgentUnavailable } from '../../../data/livechat/rooms';
import { createBotAgent, getRandomVisitorToken } from '../../../data/livechat/users';
import { updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';

describe('LIVECHAT - Utils', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
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
			await updateSetting('Livechat_validate_offline_email', 'afsdxcvxc');
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
		it('should have custom fields data', async () => {
			const customFieldName = `new_custom_field_${Date.now()}`;
			await createCustomField({
				searchable: true,
				field: customFieldName,
				label: customFieldName,
				defaultValue: 'test_default_address',
				scope: 'visitor',
				visibility: 'visible',
				regexp: '',
				public: true,
				required: false,
				options: '',
			});

			const { body } = await request.get(api('livechat/config')).set(credentials);

			expect(body).to.have.property('config');
			expect(body.config).to.have.property('customFields').that.is.an('array');
			expect(body.config.customFields).to.have.length.greaterThan(0);
			const customField = body.config.customFields.find((field: any) => field._id === customFieldName);
			expect(customField).to.be.an('object');
			expect(customField).to.have.property('label', customFieldName);

			await deleteCustomField(customFieldName);
		});
		(IS_EE ? it : it.skip)('should return online as true if there is at least one agent online', async () => {
			const { department } = await createDepartmentWithAnOnlineAgent();

			const { body } = await request.get(api(`livechat/config?department=${department._id}`)).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.have.property('online', true);
		});
		(IS_EE ? it : it.skip)('should return online as false if there is no agent online', async () => {
			const { department, agent } = await createDepartmentWithAnOnlineAgent();
			await makeAgentUnavailable(agent.credentials);

			const { body } = await request.get(api(`livechat/config?department=${department._id}`)).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.have.property('online', false);
		});
		(IS_EE ? it : it.skip)('should return online as true if bot is online and there is no agent online', async () => {
			await updateSetting('Livechat_assign_new_conversation_to_bot', true);

			const { department, agent } = await createDepartmentWithAnOnlineAgent();
			await makeAgentUnavailable(agent.credentials);

			const botUser = await createBotAgent();
			await addOrRemoveAgentFromDepartment(department._id, { agentId: botUser.user._id, username: botUser.user.username as string }, true);

			const { body } = await request.get(api(`livechat/config?department=${department._id}`)).set(credentials);
			expect(body).to.have.property('config');

			await updateSetting('Livechat_assign_new_conversation_to_bot', false);
			await makeAgentUnavailable(botUser.credentials);
		});
		it('should return a guest if there exists a guest with the same token', async () => {
			const guest = await createVisitor();
			const { body } = await request.get(api(`livechat/config?token=${guest.token}`)).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.have.property('guest');
			expect(body.config.guest).to.have.property('name', guest.name);
		});
		it('should not return a guest if there exists a guest with the same token but the guest is not online', async () => {
			const token = getRandomVisitorToken();

			const { body } = await request.get(api(`livechat/config?token=${token}`)).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.not.have.property('guest');
		});
		it('should return no online room if visitor is not chatting with an agent', async () => {
			const visitor = await createVisitor();
			const { body } = await request.get(api(`livechat/config?token=${visitor.token}`)).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.not.have.property('room');
		});
		it('should return online room if visitor is already chatting with an agent', async () => {
			const newVisitor = await createVisitor();
			const newRoom = await createLivechatRoom(newVisitor.token);

			const { body } = await request.get(api(`livechat/config?token=${newVisitor.token}`)).set(credentials);

			expect(body).to.have.property('config');
			expect(body.config).to.have.property('room');
			expect(body.config.room).to.have.property('_id', newRoom._id);
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
	describe('livechat/visitor.callStatus', () => {
		it('should fail if token is not in body params', async () => {
			const { body } = await request.post(api('livechat/visitor.callStatus')).set(credentials).send({});
			expect(body).to.have.property('success', false);
		});
		it('should fail if rid is not in body params', async () => {
			const { body } = await request.post(api('livechat/visitor.callStatus')).set(credentials).send({ token: 'test' });
			expect(body).to.have.property('success', false);
		});
		it('should fail if callStatus is not in body params', async () => {
			const { body } = await request.post(api('livechat/visitor.callStatus')).set(credentials).send({ token: 'test', rid: 'test' });
			expect(body).to.have.property('success', false);
		});
		it('should fail if callId is not in body params', async () => {
			const { body } = await request
				.post(api('livechat/visitor.callStatus'))
				.set(credentials)
				.send({ token: 'test', rid: 'test', callStatus: 'test' });
			expect(body).to.have.property('success', false);
		});
		it('should fail if token is not a valid guest token', async () => {
			const { body } = await request
				.post(api('livechat/visitor.callStatus'))
				.set(credentials)
				.send({ token: new Date().getTime(), rid: 'test', callStatus: 'test', callId: 'test' });
			expect(body).to.have.property('success', false);
		});
		it('should try update a call status on room', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request
				.post(api('livechat/visitor.callStatus'))
				.set(credentials)
				.send({ token: visitor.token, rid: room._id, callStatus: 'going', callId: 'test' });
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('callStatus', 'going');
			expect(body).to.have.property('token', visitor.token);
		});
	});
});
