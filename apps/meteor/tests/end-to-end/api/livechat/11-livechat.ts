import type { Credentials } from '@rocket.chat/api-client';
import type { ILivechatDepartment, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { sleep } from '../../../../lib/utils/sleep';
import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createCustomField, deleteCustomField } from '../../../data/livechat/custom-fields';
import {
	addOrRemoveAgentFromDepartment,
	createDepartmentWithAnOfflineAgent,
	createDepartmentWithAnOnlineAgent,
	deleteDepartment,
} from '../../../data/livechat/department';
import {
	createVisitor,
	createLivechatRoom,
	makeAgentUnavailable,
	closeOmnichannelRoom,
	sendMessage,
	deleteVisitor,
	createDepartment,
} from '../../../data/livechat/rooms';
import { createBotAgent, getRandomVisitorToken } from '../../../data/livechat/users';
import type { WithRequiredProperty } from '../../../data/livechat/utils';
import { removePermissionFromAllRoles, restorePermissionToRoles, updatePermission, updateSetting } from '../../../data/permissions.helper';
import { deleteUser } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

describe('LIVECHAT - Utils', () => {
	before((done) => getCredentials(done));
	before(async () => {
		await updateSetting('Omnichannel_enable_department_removal', true);
	});

	after(async () => {
		await updateSetting('Livechat_enabled', true);
		await updateSetting('Livechat_offline_email', '');
		await updateSetting('Omnichannel_enable_department_removal', false);
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
		let emptyDepartment: ILivechatDepartment;
		let forwardDepartment: ILivechatDepartment;
		let testDepartment: ILivechatDepartment;
		let agent: { user: WithRequiredProperty<IUser, 'username'>; credentials: Credentials };
		let agent2: { user: WithRequiredProperty<IUser, 'username'>; credentials: Credentials };

		before(async () => {
			if (!IS_EE) {
				return;
			}

			emptyDepartment = await createDepartment();
			({ department: forwardDepartment, agent } = await createDepartmentWithAnOnlineAgent());
			({ department: testDepartment, agent: agent2 } = await createDepartmentWithAnOfflineAgent({
				departmentsAllowedToForward: [forwardDepartment._id],
			}));
		});

		after(() => {
			if (!IS_EE) {
				return;
			}

			return Promise.all([
				deleteDepartment(emptyDepartment._id),
				deleteDepartment(forwardDepartment._id),
				deleteDepartment(testDepartment._id),
				deleteUser(agent.user),
				deleteUser(agent2.user),
			]);
		});

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

			const { body } = await request.get(api('livechat/config')).query({ department: department._id }).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.have.property('online', true);
		});
		(IS_EE ? it : it.skip)('should return online as false if there is no agent online', async () => {
			const { department, agent } = await createDepartmentWithAnOnlineAgent();
			await makeAgentUnavailable(agent.credentials);

			const { body } = await request.get(api('livechat/config')).query({ department: department._id }).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.have.property('online', false);
		});
		(IS_EE ? it : it.skip)('should return online as true if bot is online and there is no agent online', async () => {
			await updateSetting('Livechat_assign_new_conversation_to_bot', true);

			const { department, agent } = await createDepartmentWithAnOnlineAgent();
			await makeAgentUnavailable(agent.credentials);

			const botUser = await createBotAgent();
			await addOrRemoveAgentFromDepartment(department._id, { agentId: botUser.user._id, username: botUser.user.username as string }, true);

			const { body } = await request.get(api('livechat/config')).query({ department: department._id }).set(credentials);
			expect(body).to.have.property('config');

			await updateSetting('Livechat_assign_new_conversation_to_bot', false);
			await makeAgentUnavailable(botUser.credentials);
		});
		it('should return a guest if there exists a guest with the same token', async () => {
			const guest = await createVisitor();
			const { body } = await request.get(api('livechat/config')).query({ token: guest.token }).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.have.property('guest');
			expect(body.config.guest).to.have.property('name', guest.name);
		});
		it('should not return a guest if there exists a guest with the same token but the guest is not online', async () => {
			const token = getRandomVisitorToken();

			const { body } = await request.get(api('livechat/config')).query({ token }).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.not.have.property('guest');
		});
		it('should return no online room if visitor is not chatting with an agent', async () => {
			const visitor = await createVisitor();
			const { body } = await request.get(api('livechat/config')).query({ token: visitor.token }).set(credentials);
			expect(body).to.have.property('config');
			expect(body.config).to.not.have.property('room');
		});
		it('should return online room if visitor is already chatting with an agent', async () => {
			const newVisitor = await createVisitor();
			const newRoom = await createLivechatRoom(newVisitor.token);

			const { body } = await request.get(api('livechat/config')).query({ token: newVisitor.token }).set(credentials);

			expect(body).to.have.property('config');
			expect(body.config).to.have.property('room');
			expect(body.config.room).to.have.property('_id', newRoom._id);
		});
		(IS_EE ? it : it.skip)('should return list of departments with at least one agent', async () => {
			const { body } = await request.get(api('livechat/config')).set(credentials);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('config');
			expect(body.config).to.have.property('departments');
			expect(body.config.departments).to.be.an('array').with.lengthOf.at.least(2);

			expect(body.config.departments).to.not.deep.include({
				_id: emptyDepartment._id,
				name: emptyDepartment.name,
				showOnRegistration: emptyDepartment.showOnRegistration,
				showOnOfflineForm: emptyDepartment.showOnOfflineForm,
			});
			expect(body.config.departments).to.deep.include({
				_id: forwardDepartment._id,
				name: forwardDepartment.name,
				showOnRegistration: forwardDepartment.showOnRegistration,
				showOnOfflineForm: forwardDepartment.showOnOfflineForm,
			});
			expect(body.config.departments).to.deep.include({
				_id: testDepartment._id,
				name: testDepartment.name,
				showOnRegistration: testDepartment.showOnRegistration,
				showOnOfflineForm: testDepartment.showOnOfflineForm,
				departmentsAllowedToForward: [forwardDepartment._id],
			});
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
		it('should allow a visitor to get a transcript even if token changed by using an old token that matches room.v', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room._id);
			const visitor2 = await createVisitor(undefined, undefined, visitor.visitorEmails?.[0].address);
			const room2 = await createLivechatRoom(visitor2.token);
			await closeOmnichannelRoom(room2._id);

			expect(visitor.token !== visitor2.token).to.be.true;
			const { body } = await request
				.post(api('livechat/transcript'))
				.set(credentials)
				.send({ token: visitor.token, rid: room._id, email: 'visitor@notadomain.com' });
			expect(body).to.have.property('success', true);

			const { body: body2 } = await request
				.post(api('livechat/transcript'))
				.set(credentials)
				.send({ token: visitor2.token, rid: room2._id, email: 'visitor@notadomain.com' });
			expect(body2).to.have.property('success', true);
		});
	});

	describe('livechat/transcript/:rid', () => {
		it('should fail if user is not authenticated', async () => {
			await request.delete(api('livechat/transcript/rid')).send({}).expect(401);
		});
		it('should fail if user doesnt have "send-omnichannel-chat-transcript" permission', async () => {
			const user = await createVisitor();
			const room = await createLivechatRoom(user.token);
			await removePermissionFromAllRoles('send-omnichannel-chat-transcript');

			await request
				.delete(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({})
				.expect(403);
		});
		it('should fail if rid is not a valid room id', async () => {
			await restorePermissionToRoles('send-omnichannel-chat-transcript');
			await request.delete(api('livechat/transcript/rid')).set(credentials).send({}).expect(400);
		});
		it('should fail if room is not open', async () => {
			const user = await createVisitor();
			const room = await createLivechatRoom(user.token);
			await closeOmnichannelRoom(room._id);
			await request
				.delete(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({})
				.expect(400);
		});
		it('should fail if room doesnt have transcript requested', async () => {
			const user = await createVisitor();
			const room = await createLivechatRoom(user.token);

			await request
				.delete(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({})
				.expect(400);
		});
		it('should remove transcript if all good', async () => {
			const user = await createVisitor();
			const room = await createLivechatRoom(user.token);

			await request
				.post(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({ email: 'abc@abc.com', subject: 'test' })
				.expect(200);

			await request
				.delete(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({})
				.expect(200);
		});
	});

	describe('POST livechat/transcript/:rid', () => {
		it('should fail if user is not authenticated', async () => {
			await request.post(api('livechat/transcript/rid')).send({}).expect(401);
		});
		it('should fail if "email" param is not sent', async () => {
			const user = await createVisitor();
			const room = await createLivechatRoom(user.token);

			await request
				.post(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({})
				.expect(400);
		});
		it('should fail if "subject" param is not sent', async () => {
			const user = await createVisitor();
			const room = await createLivechatRoom(user.token);

			await request
				.post(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({ email: 'abc@abc.xmz' })
				.expect(400);
		});
		it('should fail if user doesnt have "send-omnichannel-chat-transcript" permission', async () => {
			const user = await createVisitor();
			const room = await createLivechatRoom(user.token);
			await updatePermission('send-omnichannel-chat-transcript', []);

			await request
				.post(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({ email: 'abc@abc.com', subject: 'test' })
				.expect(403);
		});
		it('should fail if rid is not a valid room id', async () => {
			await updatePermission('send-omnichannel-chat-transcript', ['livechat-manager', 'admin']);
			await request.post(api('livechat/transcript/rid')).set(credentials).send({ email: 'abc@abc.com', subject: 'test' }).expect(400);
		});
		it('should fail if room is not open', async () => {
			const user = await createVisitor();
			const room = await createLivechatRoom(user.token);
			await closeOmnichannelRoom(room._id);
			await request
				.post(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({ email: 'abc@abc.com', subject: 'test' })
				.expect(400);
		});
		it('should fail if room already has transcript requested', async () => {
			const user = await createVisitor();
			const room = await createLivechatRoom(user.token);

			await request
				.post(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({ email: 'abc@abc.com', subject: 'test' })
				.expect(200);

			await request
				.post(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({ email: 'abc@abc.com', subject: 'test' })
				.expect(400);
		});
		it('should request transcript if all good', async () => {
			const user = await createVisitor();
			const room = await createLivechatRoom(user.token);

			await request
				.post(api(`livechat/transcript/${room._id}`))
				.set(credentials)
				.send({ email: 'abc@abc.com', subject: 'test' })
				.expect(200);
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
	describe('livechat/visitors.search', () => {
		it('should bring sorted data by last chat time', async () => {
			const visitor1 = await createVisitor(undefined, 'VisitorInPast');
			const room1 = await createLivechatRoom(visitor1.token);

			const visitor2 = await createVisitor(undefined, 'VisitorInPresent');
			const room2 = await createLivechatRoom(visitor2.token);

			const { body: result1 } = await request
				.get(api('livechat/visitors.search'))
				.query({ term: 'VisitorIn', sort: '{"lastChat.ts":1}' })
				.set(credentials)
				.send();

			expect(result1).to.have.property('visitors').that.is.an('array');
			expect(result1.visitors[0]).to.have.property('name');
			expect(result1.visitors[0].name).to.be.eq('VisitorInPast');

			const { body: result2 } = await request
				.get(api('livechat/visitors.search'))
				.query({ term: 'VisitorIn', sort: '{"lastChat.ts":-1}' })
				.set(credentials)
				.send();

			expect(result2).to.have.property('visitors').that.is.an('array');
			expect(result2.visitors[0]).to.have.property('name');
			expect(result2.visitors[0].name).to.be.eq('VisitorInPresent');

			await closeOmnichannelRoom(room1._id);
			await closeOmnichannelRoom(room2._id);
			await deleteVisitor(visitor1.token);
			await deleteVisitor(visitor2.token);
		});
	});

	describe('livechat/message', () => {
		const visitorTokens: string[] = [];

		after(() => Promise.all(visitorTokens.map((token) => deleteVisitor(token))));

		it('should fail if no token', async () => {
			await request.post(api('livechat/message')).set(credentials).send({}).expect(400);
		});
		it('should fail if no rid', async () => {
			await request.post(api('livechat/message')).set(credentials).send({ token: 'test' }).expect(400);
		});
		it('should fail if no msg', async () => {
			await request.post(api('livechat/message')).set(credentials).send({ token: 'test', rid: 'test' }).expect(400);
		});
		it('should fail if token is invalid', async () => {
			await request.post(api('livechat/message')).set(credentials).send({ token: 'test', rid: 'test', msg: 'test' }).expect(400);
		});
		it('should fail if rid is invalid', async () => {
			const visitor = await createVisitor();
			visitorTokens.push(visitor.token);
			await request.post(api('livechat/message')).set(credentials).send({ token: visitor.token, rid: 'test', msg: 'test' }).expect(400);
		});
		it('should fail if rid belongs to another visitor', async () => {
			const visitor = await createVisitor();
			const visitor2 = await createVisitor();
			visitorTokens.push(visitor.token, visitor2.token);

			const room = await createLivechatRoom(visitor2.token);
			await request.post(api('livechat/message')).set(credentials).send({ token: visitor.token, rid: room._id, msg: 'test' }).expect(400);
		});
		it('should fail if room is closed', async () => {
			const visitor = await createVisitor();
			visitorTokens.push(visitor.token);

			const room = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room._id);
			await request.post(api('livechat/message')).set(credentials).send({ token: visitor.token, rid: room._id, msg: 'test' }).expect(400);
		});
		it('should fail if message is greater than Livechat_enable_message_character_limit setting', async () => {
			const visitor = await createVisitor();
			visitorTokens.push(visitor.token);

			const room = await createLivechatRoom(visitor.token);
			await updateSetting('Livechat_enable_message_character_limit', true);
			await updateSetting('Livechat_message_character_limit', 1);
			await request.post(api('livechat/message')).set(credentials).send({ token: visitor.token, rid: room._id, msg: 'test' }).expect(400);

			await updateSetting('Livechat_enable_message_character_limit', false);
		});
		it('should send a message', async () => {
			const visitor = await createVisitor();
			visitorTokens.push(visitor.token);

			const room = await createLivechatRoom(visitor.token);
			await request.post(api('livechat/message')).set(credentials).send({ token: visitor.token, rid: room._id, msg: 'test' }).expect(200);
		});
	});

	describe('[GET] livechat/message/:_id', () => {
		it('should fail if no token is provided', async () => {
			await request.get(api('livechat/message/rid')).set(credentials).expect(400);
		});
		it('should fail if no rid is provided', async () => {
			await request.get(api('livechat/message/mid')).query({ token: 'test' }).expect(400);
		});
		it('should fail if token points to an invalid visitor', async () => {
			await request.get(api('livechat/message/mid')).query({ token: 'test', rid: 'test' }).expect(400);
		});
		it('should fail if room points to an invalid room', async () => {
			const visitor = await createVisitor();
			await request.get(api('livechat/message/mid')).query({ token: visitor.token, rid: 'test' }).expect(400);
		});
		it('should fail if _id points to an invalid message', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request.get(api('livechat/message/mid')).query({ token: visitor.token, rid: room._id }).expect(400);
		});
		it('should return a message', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const message = await sendMessage(room._id, 'test', visitor.token);
			await request
				.get(api(`livechat/message/${message._id}`))
				.query({ token: visitor.token, rid: room._id })
				.expect(200);
		});
	});

	describe('[PUT] livechat/message/:_id', () => {
		it('should fail if no token is provided', async () => {
			await request.put(api('livechat/message/rid')).set(credentials).expect(400);
		});
		it('should fail if no rid is provided', async () => {
			await request.put(api('livechat/message/mid')).query({ token: 'test' }).expect(400);
		});
		it('should fail if token points to an invalid visitor', async () => {
			await request.put(api('livechat/message/mid')).query({ token: 'test', rid: 'test' }).expect(400);
		});
		it('should fail if room points to an invalid room', async () => {
			const visitor = await createVisitor();
			await request.put(api('livechat/message/mid')).query({ token: visitor.token, rid: 'test' }).expect(400);
		});
		it('should fail if _id points to an invalid message', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request.put(api('livechat/message/mid')).query({ token: visitor.token, rid: room._id }).expect(400);
		});
		it('should update a message', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const message = await sendMessage(room._id, 'test', visitor.token);
			const { body } = await request
				.put(api(`livechat/message/${message._id}`))
				.set(credentials)
				.send({ msg: 'test2', token: visitor.token, rid: room._id })
				.expect(200);
			expect(body).to.have.property('message');
			expect(body.message).to.have.property('_id', message._id);
			expect(body.message).to.have.property('msg', 'test2');
		});
	});

	describe('[DELETE] livechat/message/:_id', () => {
		it('should fail if no token is provided', async () => {
			await request.delete(api('livechat/message/rid')).set(credentials).expect(400);
		});
		it('should fail if no rid is provided', async () => {
			await request.delete(api('livechat/message/mid')).query({ token: 'test' }).expect(400);
		});
		it('should fail if token points to an invalid visitor', async () => {
			await request.delete(api('livechat/message/mid')).query({ token: 'test', rid: 'test' }).expect(400);
		});
		it('should fail if room points to an invalid room', async () => {
			const visitor = await createVisitor();
			await request.delete(api('livechat/message/mid')).query({ token: visitor.token, rid: 'test' }).expect(400);
		});
		it('should fail if _id points to an invalid message', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request.delete(api('livechat/message/mid')).query({ token: visitor.token, rid: room._id }).expect(400);
		});
		it('should delete a message', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const message = await sendMessage(room._id, 'test', visitor.token);

			const { body } = await request
				.delete(api(`livechat/message/${message._id}`))
				.send({ token: visitor.token, rid: room._id })
				.expect(200);

			expect(body).to.have.property('message');
			expect(body.message).to.have.property('_id', message._id);
		});
	});

	describe('livechat/messages.history/:rid', () => {
		it('should fail if no token is provided', async () => {
			await request.get(api('livechat/messages.history/rid')).set(credentials).expect(400);
		});
		it('should fail if token points to an invalid visitor', async () => {
			await request.get(api('livechat/messages.history/rid')).query({ token: 'test' }).expect(400);
		});
		it('should fail if room points to an invalid room', async () => {
			const visitor = await createVisitor();
			await request.get(api('livechat/messages.history/rid')).query({ token: visitor.token }).expect(400);
		});
		it('should fail if room points to a room of another visitor', async () => {
			const visitor = await createVisitor();
			const visitor2 = await createVisitor();
			const room = await createLivechatRoom(visitor2.token);
			await request
				.get(api(`livechat/messages.history/${room._id}`))
				.query({ token: visitor.token })
				.expect(400);
		});
		it('should return a list of messages', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'test', visitor.token);
			const { body } = await request
				.get(api(`livechat/messages.history/${room._id}`))
				.query({ token: visitor.token })
				.expect(200);
			expect(body).to.have.property('messages').that.is.an('array');
			expect(body.messages).to.have.lengthOf(2);
			expect(body.messages[0]).to.have.property('msg', 'test');
		});
		it('should return a list of messages with offset and count', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'test', visitor.token);
			await sendMessage(room._id, 'test2', visitor.token);
			const { body } = await request
				.get(api(`livechat/messages.history/${room._id}`))
				.query({ token: visitor.token, offset: 1, limit: 1 })
				.expect(200);
			expect(body).to.have.property('messages').that.is.an('array');
			expect(body.messages).to.have.lengthOf(1);
			expect(body.messages[0]).to.have.property('msg', 'test');
		});
		it('should return a list of unseen messages', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'test', visitor.token);
			await sendMessage(room._id, 'test2', visitor.token);
			const { body } = await request
				.get(api(`livechat/messages.history/${room._id}`))
				.query({ token: visitor.token, ls: new Date() })
				.expect(200);
			expect(body).to.have.property('messages').that.is.an('array');
			expect(body.messages).to.have.lengthOf(3);
			expect(body.messages[0]).to.have.property('msg', 'test2');
		});
		it('should return a list of messages up to a specific date', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const msg = await sendMessage(room._id, 'test', visitor.token);
			const tsPlusSomeMillis = new Date(new Date(msg.ts).getTime() + 500);
			await sleep(1000);
			await sendMessage(room._id, 'test2', visitor.token);
			const { body } = await request
				.get(api(`livechat/messages.history/${room._id}`))
				.query({ token: visitor.token, end: tsPlusSomeMillis })
				.expect(200);
			expect(body).to.have.property('messages').that.is.an('array');
			expect(body.messages).to.have.lengthOf(2);
			expect(body.messages[0]).to.have.property('msg', 'test');
		});
		it('should return message history for a valid room with pagination', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);

			const { body } = await request
				.get(api(`livechat/messages.history/${room._id}`))
				.set(credentials)
				.query({ token: visitor.token, limit: 1 })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages').of.length(1);
			expect(body.messages[0]).to.have.property('msg', 'Hello');
		});
		it('should return message history for a valid room with pagination and offset', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);

			const { body } = await request
				.get(api(`livechat/messages.history/${room._id}`))
				.set(credentials)
				.query({ token: visitor.token, limit: 1, offset: 1 })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages').of.length(1);
			expect(body.messages[0]).to.have.property('t');
		});
	});

	(IS_EE ? describe : describe.skip)('[EE] livechat widget', () => {
		it('should include additional css when provided via Livechat_WidgetLayoutClasses setting', async () => {
			await updateSetting('Livechat_WidgetLayoutClasses', 'http://my.css.com/my.css');
			const x = await request.get('/livechat').expect(200);

			expect(x.text.includes('http://my.css.com/my.css')).to.be.true;
		});

		it('should remove additional css when setting Livechat_WidgetLayoutClasses is empty', async () => {
			await updateSetting('Livechat_WidgetLayoutClasses', '');
			const x = await request.get('/livechat').expect(200);

			expect(x.text.includes('http://my.css.com/my.css')).to.be.false;
		});

		it('should include additional js when provided via Livechat_AdditionalWidgetScripts setting', async () => {
			await updateSetting('Livechat_AdditionalWidgetScripts', 'http://my.js.com/my.js');
			const x = await request.get('/livechat').expect(200);

			expect(x.text.includes('http://my.js.com/my.js')).to.be.true;
		});

		it('should remove additional js when setting Livechat_AdditionalWidgetScripts is empty', async () => {
			await updateSetting('Livechat_AdditionalWidgetScripts', '');
			const x = await request.get('/livechat').expect(200);

			expect(x.text.includes('http://my.js.com/my.js')).to.be.false;
		});
	});
});
