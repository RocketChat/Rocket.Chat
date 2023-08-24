import { faker } from '@faker-js/faker';
import type {
	ILivechatInquiryRecord,
	ILivechatPriority,
	IOmnichannelRoom,
	IOmnichannelServiceLevelAgreements,
} from '@rocket.chat/core-typings';
import { OmnichannelSortingMechanismSettingType } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createDepartmentWithAnOnlineAgent } from '../../../data/livechat/department';
import { fetchAllInquiries } from '../../../data/livechat/inquiries';
import { createSLA, deleteSLA, bulkCreateSLA, deleteAllSLA } from '../../../data/livechat/priorities';
import {
	createAgent,
	createVisitor,
	createLivechatRoom,
	bulkCreateLivechatRooms,
	startANewLivechatRoomAndTakeIt,
} from '../../../data/livechat/rooms';
import {
	addPermissions,
	removePermissionFromAllRoles,
	removePermissions,
	restorePermissionToRoles,
	updateEESetting,
	updatePermission,
	updateSetting,
} from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';
import { generateRandomSLAData } from '../../../e2e/utils/omnichannel/sla';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - Priorities & SLAs', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
	});

	this.afterAll(async () => {
		await addPermissions({
			'manage-livechat-priorities': ['admin', 'livechat-manager'],
			'manage-livechat-sla': ['admin', 'livechat-manager'],
			'view-l-room': ['admin', 'livechat-manager', 'livechat-agent'],
		});
	});

	describe('livechat/sla', () => {
		// GET
		it('should return an "unauthorized error" when the user does not have the necessary permission for [GET] livechat/sla endpoint', async () => {
			await removePermissions(['manage-livechat-sla', 'view-l-room']);
			const response = await request.get(api('livechat/sla')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of slas', async () => {
			await addPermissions({
				'manage-livechat-sla': ['admin', 'livechat-manager'],
				'view-l-room': ['livechat-agent', 'admin', 'livechat-manager'],
			});
			const sla = await createSLA();
			expect(sla).to.not.be.undefined;
			expect(sla).to.have.property('_id');
			const response = await request.get(api('livechat/sla')).set(credentials).expect('Content-Type', 'application/json').expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.sla).to.be.an('array').with.lengthOf.greaterThan(0);
			const current = response.body.sla.find((p: IOmnichannelServiceLevelAgreements) => p && p?._id === sla._id);
			expect(current).to.be.an('object');
			expect(current).to.have.property('name', sla.name);
			expect(current).to.have.property('description', sla.description);
			expect(current).to.have.property('dueTimeInMinutes', sla.dueTimeInMinutes);
			await deleteSLA(sla._id);
		});
		// POST
		it('should return an "unauthorized error" when the user does not have the necessary permission for [POST] livechat/sla endpoint', async () => {
			await updatePermission('manage-livechat-sla', []);
			const response = await request
				.post(api('livechat/sla'))
				.set(credentials)
				.send(generateRandomSLAData())
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should create a new sla', async () => {
			await restorePermissionToRoles('manage-livechat-sla');

			const sla = generateRandomSLAData();

			const response = await request
				.post(api('livechat/sla'))
				.set(credentials)
				.send(sla)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.sla).to.be.an('object');
			expect(response.body.sla).to.have.property('_id');
			expect(response.body.sla).to.have.property('name', sla.name);
			expect(response.body.sla).to.have.property('description', sla.description);
			expect(response.body.sla).to.have.property('dueTimeInMinutes', sla.dueTimeInMinutes);

			await deleteSLA(response.body.sla._id);
		});
		it('should throw an error when trying to create a duplicate sla with same dueTimeInMinutes', async () => {
			const firstSla = generateRandomSLAData();

			const response = await request
				.post(api('livechat/sla'))
				.set(credentials)
				.send(firstSla)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);

			const secondSla = generateRandomSLAData();

			secondSla.dueTimeInMinutes = firstSla.dueTimeInMinutes;

			const secondResponse = await request
				.post(api('livechat/sla'))
				.set(credentials)
				.send(secondSla)
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(secondResponse.body).to.have.property('success', false);
			expect(secondResponse.body).to.have.property('error');
			expect(secondResponse.body?.error).to.contain('error-duplicated-sla');

			await deleteSLA(response.body.sla._id);
		});
		it('should throw an error when trying to create a duplicate sla with same name', async () => {
			const firstSla = generateRandomSLAData();

			const response = await request
				.post(api('livechat/sla'))
				.set(credentials)
				.send(firstSla)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);

			const secondSla = generateRandomSLAData();

			secondSla.name = firstSla.name;

			const secondResponse = await request
				.post(api('livechat/sla'))
				.set(credentials)
				.send(secondSla)
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(secondResponse.body).to.have.property('success', false);
			expect(secondResponse.body).to.have.property('error');
			expect(secondResponse.body?.error).to.contain('error-duplicated-sla');

			await deleteSLA(response.body.sla._id);
		});
	});

	describe('livechat/sla/:slaId', () => {
		// GET
		it('should return an "unauthorized error" when the user does not have the necessary permission for [GET] livechat/sla/:slaId endpoint', async () => {
			await Promise.all([removePermissionFromAllRoles('manage-livechat-sla'), removePermissionFromAllRoles('view-l-room')]);

			const response = await request.get(api('livechat/sla/123')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should create, find and delete an sla', async () => {
			await Promise.all([restorePermissionToRoles('manage-livechat-sla'), restorePermissionToRoles('view-l-room')]);

			const sla = await createSLA();
			const response = await request
				.get(api(`livechat/sla/${sla._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.be.an('object');
			expect(response.body._id).to.be.equal(sla._id);
			await deleteSLA(sla._id);
		});
		// PUT
		it('should return an "unauthorized error" when the user does not have the necessary permission for [PUT] livechat/sla/:slaId endpoint', async () => {
			await removePermissionFromAllRoles('manage-livechat-sla');

			const response = await request
				.put(api('livechat/sla/123'))
				.set(credentials)
				.send(generateRandomSLAData())
				.expect('Content-Type', 'application/json')
				.expect(403);

			expect(response.body).to.have.property('success', false);
		});
		it('should update an sla', async () => {
			await restorePermissionToRoles('manage-livechat-sla');

			const sla = await createSLA();
			const newSlaData = generateRandomSLAData();

			const response = await request
				.put(api(`livechat/sla/${sla._id}`))
				.set(credentials)
				.send(newSlaData)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.sla).to.be.an('object');
			expect(response.body.sla).to.have.property('_id');
			expect(response.body.sla).to.have.property('name', newSlaData.name);
			expect(response.body.sla).to.have.property('description', newSlaData.description);
			expect(response.body.sla).to.have.property('dueTimeInMinutes', newSlaData.dueTimeInMinutes);

			await deleteSLA(response.body.sla._id);
		});
		it('should throw an error when trying to update a sla with a duplicate name', async () => {
			const firstSla = await createSLA();
			const secondSla = await createSLA();

			secondSla.name = firstSla.name;

			const response = await request
				.put(api(`livechat/sla/${secondSla._id}`))
				.set(credentials)
				.send({
					name: secondSla.name,
					description: secondSla.description,
					dueTimeInMinutes: secondSla.dueTimeInMinutes,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('error-duplicated-sla');

			await deleteSLA(firstSla._id);
			await deleteSLA(secondSla._id);
		});
		it('should throw an error when trying to update a sla with a duplicate dueTimeInMinutes', async () => {
			const firstSla = await createSLA();
			const secondSla = await createSLA();

			secondSla.dueTimeInMinutes = firstSla.dueTimeInMinutes;

			const response = await request
				.put(api(`livechat/sla/${secondSla._id}`))
				.set(credentials)
				.send({
					name: secondSla.name,
					description: secondSla.description,
					dueTimeInMinutes: secondSla.dueTimeInMinutes,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('error-duplicated-sla');

			await deleteSLA(firstSla._id);
			await deleteSLA(secondSla._id);
		});

		// DELETE
		it('should return an "unauthorized error" when the user does not have the necessary permission for [DELETE] livechat/sla/:slaId endpoint', async () => {
			await updatePermission('manage-livechat-sla', []);
			const response = await request
				.delete(api('livechat/sla/123'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should delete an sla', async () => {
			await updatePermission('manage-livechat-sla', ['admin', 'livechat-manager']);
			const sla = await createSLA();
			const response = await request
				.delete(api(`livechat/sla/${sla._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
	});

	describe('livechat/inquiry.setSLA', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissions(['manage-livechat-sla', 'view-l-room', 'manage-livechat-priorities']);
			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: '123',
					sla: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if roomId is not in request body', async () => {
			await addPermissions({
				'manage-livechat-sla': ['admin', 'livechat-manager'],
				'manage-livechat-priorities': ['admin', 'livechat-manager'],
				'view-l-room': ['livechat-agent', 'admin', 'livechat-manager'],
			});
			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					sla: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if roomId is invalid', async () => {
			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: '123',
					sla: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if sla is not in request body', async () => {
			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if sla is not valid', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await createAgent();

			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: room._id,
					sla: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if inquiry is not queued', async () => {
			const {
				room: { _id: roomId },
			} = await startANewLivechatRoomAndTakeIt();

			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId,
					sla: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should prioritize an inquiry', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const sla = await createSLA();
			const response = await request
				.put(api('livechat/inquiry.setSLA'))
				.set(credentials)
				.send({
					roomId: room._id,
					sla: sla._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
	});

	describe('livechat/priorities', () => {
		let priority: ILivechatPriority;
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissions(['manage-livechat-priorities', 'view-l-room']);
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of priorities', async () => {
			await addPermissions({
				'manage-livechat-priorities': ['admin', 'livechat-manager'],
				'view-l-room': ['livechat-agent', 'admin', 'livechat-manager'],
			});
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.priorities).to.be.an('array');
			expect(response.body.priorities).to.have.lengthOf(5);
			expect(response.body.priorities[0]).to.have.property('_id');
			expect(response.body.priorities[0]).to.have.property('i18n');
			expect(response.body.priorities[0]).to.have.property('dirty');
			priority = response.body.priorities[0];
		});
		it('should return an array of priorities matching text param', async () => {
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.query({
					text: priority.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.priorities).to.be.an('array');
			expect(response.body.priorities).to.have.length.greaterThan(0);
			expect(response.body.priorities[0]).to.have.property('_id');
		});
	});

	describe('livechat/priorities/:priorityId', () => {
		let priority: ILivechatPriority;
		const name = faker.lorem.word();
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissions(['manage-livechat-priorities', 'view-l-room']);
			const response = await request.get(api('livechat/priorities/123')).set(credentials).expect(403);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('error-unauthorized');
		});
		it('should return a priority by id', async () => {
			await addPermissions({
				'manage-livechat-priorities': ['admin', 'livechat-manager'],
				'view-l-room': ['livechat-agent', 'admin', 'livechat-manager'],
			});
			const {
				body: { priorities },
			} = await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			priority = priorities[0];

			const response = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.be.an('object');
			expect(response.body._id).to.be.equal(priority._id);
		});
		it('should throw 404 when priority does not exist', async () => {
			const response = await request.get(api('livechat/priorities/123')).set(credentials).expect(404);
			expect(response.body).to.have.property('success', false);
		});
		it('should update a priority when using PUT', async () => {
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
		it('should return dirty: true after a priority has been updated', async () => {
			const response = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('dirty', true);
		});
		it('should return an array of priorities matching text param', async () => {
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.query({
					text: name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.priorities).to.be.an('array');
			expect(response.body.priorities).to.have.length.greaterThan(0);
			const pos = response.body.priorities.findIndex((p: ILivechatPriority) => p._id === priority._id);
			expect(pos).to.be.greaterThan(-1);
			expect(response.body.priorities[pos]).to.have.property('_id');
			expect(response.body.priorities[pos]).to.have.property('i18n', priority.i18n);
		});
		it('should edit a priority with a PUT', async () => {
			const newName = faker.lorem.word();
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name: newName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			const newPriorityResponse = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(newPriorityResponse.body).to.have.property('success', true);
			expect(newPriorityResponse.body).to.have.property('dirty', true);
			expect(newPriorityResponse.body).to.have.property('name', newName);
		});
		it('should fail to edit a priority with a PUT if using too many parameters', async () => {
			const newName = faker.lorem.word();
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name: newName,
					reset: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('invalid-params');
		});
		it('should fail to edit a priority with a PUT if using an object as name', async () => {
			const newName = faker.lorem.word();
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name: { name: newName },
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('invalid-params');
		});
		it('should not fail to edit a priority with a PUT if using a boolean as name (it becomes a string)', async () => {
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
		it('should fail to update a non-existing priority', async () => {
			const response = await request
				.put(api('livechat/priorities/123'))
				.set(credentials)
				.send({
					name: faker.lorem.word(),
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should reset a single priority with a reset:true PUT parameter', async () => {
			const response = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					reset: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			const newPriorityResponse = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(newPriorityResponse.body).to.have.property('success', true);
			expect(newPriorityResponse.body).to.have.property('dirty', false);
			expect(newPriorityResponse.body).to.not.have.property('name');
		});
		it('should throw a duplicate error incase there is already a priority with same name', async () => {
			const {
				body: { priorities },
			} = await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			// change name of first priority to a random name
			const newName = faker.lorem.word();
			await request
				.put(api(`livechat/priorities/${priorities[0]._id}`))
				.set(credentials)
				.send({ name: newName })
				.expect('Content-Type', 'application/json')
				.expect(200);

			// change name of second priority to the name of first priority and expect error
			const response = await request
				.put(api(`livechat/priorities/${priorities[1]._id}`))
				.set(credentials)
				.send({ name: newName })
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error', 'error-duplicate-priority-name');
		});
		it('should throw a duplicate error incase there is already a priority with same name (case insensitive)', async () => {
			const {
				body: { priorities },
			} = await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			// change name of first priority to a random name
			const newNameLowercase = faker.lorem.word().toLowerCase();
			await request
				.put(api(`livechat/priorities/${priorities[0]._id}`))
				.set(credentials)
				.send({ name: newNameLowercase })
				.expect('Content-Type', 'application/json')
				.expect(200);

			// change name of second priority to the name of first priority in different case and expect error
			const response = await request
				.put(api(`livechat/priorities/${priorities[1]._id}`))
				.set(credentials)
				.send({ name: newNameLowercase.toUpperCase() })
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error', 'error-duplicate-priority-name');
		});
	});

	describe('livechat/priorities.reset', () => {
		let priority: ILivechatPriority;
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('manage-livechat-priorities', []);
			const response = await request.post(api('livechat/priorities.reset')).set(credentials).expect(403);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('error-unauthorized');
		});
		it('should respond reset:true when a priority has been changed', async () => {
			await updatePermission('manage-livechat-priorities', ['admin', 'livechat-manager']);
			const {
				body: { priorities },
			} = await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			priority = priorities[0];

			priority.name = faker.lorem.word();
			const responseChange = await request
				.put(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.send({
					name: priority.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(responseChange.body).to.have.property('success', true);

			const response = await request
				.get(api('livechat/priorities.reset'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('reset', true);
		});
		it('should reset all priorities', async () => {
			const resetRespose = await request
				.post(api('livechat/priorities.reset'))
				.set(credentials)
				.send()
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(resetRespose.body).to.have.property('success', true);
		});
		it('should return reset: false after all priorities have been reset', async () => {
			const response = await request
				.get(api('livechat/priorities.reset'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('reset', false);
		});
		it('should change the priority name and dirty status when reset', async () => {
			const response = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('dirty', false);
			expect(response.body).to.not.have.property('name');
		});
		it('should change all priorities to their default', async () => {
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.priorities).to.be.an('array');
			response.body.priorities.forEach((priority: ILivechatPriority) => {
				expect(priority).to.not.have.property('name');
				expect(priority).to.have.property('dirty', false);
			});
		});
		it('should fail to reset when lacking permissions', async () => {
			await updatePermission('manage-livechat-priorities', []);
			const response = await request.post(api('livechat/priorities.reset')).set(credentials).expect(403);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
			expect(response.body?.error).to.contain('error-unauthorized');
		});
	});

	describe('Inquiry queue sorting mechanism', () => {
		let omniRooms: IOmnichannelRoom[];
		let departmentWithAgent: Awaited<ReturnType<typeof createDepartmentWithAnOnlineAgent>>;
		let priorities: ILivechatPriority[];
		let slas: Awaited<ReturnType<typeof bulkCreateSLA>>;

		const hasSlaProps = (inquiry: ILivechatInquiryRecord): inquiry is ILivechatInquiryRecord & { slaId: string } =>
			!!inquiry.estimatedWaitingTimeQueue && !!inquiry.slaId;
		const hasPriorityProps = (inquiry: ILivechatInquiryRecord): inquiry is ILivechatInquiryRecord & { priorityId: string } =>
			inquiry.priorityId !== undefined;

		const getPriorityOrderById = (id: string) => {
			const priority = priorities.find((priority) => priority._id === id);
			return priority?.sortItem || 0;
		};

		const sortBySLAProps = (inquiry1: ILivechatInquiryRecord, inquiry2: ILivechatInquiryRecord): number => {
			if (hasSlaProps(inquiry1) || hasSlaProps(inquiry2)) {
				if (hasSlaProps(inquiry1) && hasSlaProps(inquiry2)) {
					// if both inquiries have sla props, then sort by estimatedWaitingTimeQueue: 1
					const estimatedWaitingTimeQueue1 = inquiry1.estimatedWaitingTimeQueue;
					const estimatedWaitingTimeQueue2 = inquiry2.estimatedWaitingTimeQueue;

					if (estimatedWaitingTimeQueue1 !== estimatedWaitingTimeQueue2) {
						return estimatedWaitingTimeQueue1 - estimatedWaitingTimeQueue2;
					}
				}

				if (hasSlaProps(inquiry1)) {
					return -1;
				}

				if (hasSlaProps(inquiry2)) {
					return 1;
				}
			}

			return 0;
		};

		const sortByPriorityProps = (inquiry1: ILivechatInquiryRecord, inquiry2: ILivechatInquiryRecord): number => {
			if (hasPriorityProps(inquiry1) || hasPriorityProps(inquiry2)) {
				if (hasPriorityProps(inquiry1) && hasPriorityProps(inquiry2)) {
					// if both inquiries have priority props, then sort by priorityId: 1
					return getPriorityOrderById(inquiry1.priorityId) - getPriorityOrderById(inquiry2.priorityId);
				}

				if (hasPriorityProps(inquiry1)) {
					return -1;
				}

				if (hasPriorityProps(inquiry2)) {
					return 1;
				}
			}

			return 0;
		};

		// this should sort using logic - { ts: 1 }
		const sortByTimestamp = (inquiry1: ILivechatInquiryRecord, inquiry2: ILivechatInquiryRecord) => {
			return new Date(inquiry1.ts).getTime() - new Date(inquiry2.ts).getTime();
		};

		// this should sort using logic - { priorityWeight: 1, ts: 1 }
		const sortByPriority = (inquiry1: ILivechatInquiryRecord, inquiry2: ILivechatInquiryRecord) => {
			const priorityPropsSort = sortByPriorityProps(inquiry1, inquiry2);
			if (priorityPropsSort !== 0) {
				return priorityPropsSort;
			}

			return sortByTimestamp(inquiry1, inquiry2);
		};

		// this should sort using logic - { estimatedWaitingTimeQueue: 1, ts: 1 }
		const sortBySLA = (inquiry1: ILivechatInquiryRecord, inquiry2: ILivechatInquiryRecord) => {
			const slaPropsSort = sortBySLAProps(inquiry1, inquiry2);
			if (slaPropsSort !== 0) {
				return slaPropsSort;
			}

			return sortByTimestamp(inquiry1, inquiry2);
		};

		const filterUnnecessaryProps = (inquiries: ILivechatInquiryRecord[]) =>
			inquiries.map((inquiry) => {
				return {
					_id: inquiry._id,
					rid: inquiry.rid,
					...(hasPriorityProps(inquiry) && {
						priority: {
							priorityWeight: getPriorityOrderById(inquiry.priorityId),
							id: inquiry.priorityWeight,
						},
					}),
					...(hasSlaProps(inquiry) && {
						sla: {
							estimatedWaitingTimeQueue: inquiry.estimatedWaitingTimeQueue,
						},
					}),
					ts: inquiry.ts,
				};
			});

		const compareInquiries = (inquiries1: ILivechatInquiryRecord[], inquiries2: ILivechatInquiryRecord[]) => {
			const filteredInquiries1 = filterUnnecessaryProps(inquiries1);
			const filteredInquiries2 = filterUnnecessaryProps(inquiries2);

			expect(filteredInquiries1).to.deep.equal(filteredInquiries2);
		};

		it('it should create all the data required for further testing', async () => {
			departmentWithAgent = await createDepartmentWithAnOnlineAgent();

			const {
				body: { priorities: prioritiesResponse },
			} = (await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(200)) as {
				body: { priorities: ILivechatPriority[] };
			};
			priorities = prioritiesResponse;

			await deleteAllSLA();
			slas = await bulkCreateSLA(5);

			type RoomParamsReturnType = { priority: string } | { sla: string } | { priority: string; sla: string } | undefined;

			// create 20 rooms, 5 with only priority, 5 with only SLA, 5 with both, 5 without priority or SLA
			omniRooms = await bulkCreateLivechatRooms(20, departmentWithAgent.department._id, (index): RoomParamsReturnType => {
				if (index < 5) {
					return {
						priority: priorities[index]._id,
					};
				}

				if (index < 10) {
					return {
						sla: slas[index - 5]._id,
					};
				}

				if (index < 15) {
					// random number between 0 and 4
					const randomPriorityIndex = Math.floor(Math.random() * 5);
					const randomSlaIndex = Math.floor(Math.random() * 5);

					return {
						priority: priorities[randomPriorityIndex]._id,
						sla: slas[randomSlaIndex]._id,
					};
				}
			});
		});

		it('it should sort the queue based on priority', async () => {
			await updateEESetting('Omnichannel_sorting_mechanism', OmnichannelSortingMechanismSettingType.Priority);

			const origInquiries = await fetchAllInquiries(departmentWithAgent.agent.credentials, departmentWithAgent.department._id);
			expect(origInquiries.length).to.be.greaterThanOrEqual(omniRooms.length);

			const expectedSortedInquiries: ILivechatInquiryRecord[] = JSON.parse(JSON.stringify(origInquiries));

			expectedSortedInquiries.sort(sortByPriority);

			compareInquiries(origInquiries, expectedSortedInquiries);
		});

		it('it should sort the queue based on slas', async () => {
			await updateEESetting('Omnichannel_sorting_mechanism', OmnichannelSortingMechanismSettingType.SLAs);

			const origInquiries = await fetchAllInquiries(departmentWithAgent.agent.credentials, departmentWithAgent.department._id);
			expect(origInquiries.length).to.be.greaterThanOrEqual(omniRooms.length);

			const expectedSortedInquiries = origInquiries.sort(sortBySLA);

			compareInquiries(origInquiries, expectedSortedInquiries);
		});

		it('it should sort the queue based on timestamp', async () => {
			await updateEESetting('Omnichannel_sorting_mechanism', OmnichannelSortingMechanismSettingType.Timestamp);

			const origInquiries = await fetchAllInquiries(departmentWithAgent.agent.credentials, departmentWithAgent.department._id);
			expect(origInquiries.length).to.be.greaterThanOrEqual(omniRooms.length);

			const expectedSortedInquiries = origInquiries.sort(sortByTimestamp);

			compareInquiries(origInquiries, expectedSortedInquiries);
		});
	});
});
