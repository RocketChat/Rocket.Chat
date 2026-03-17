import fs from 'fs';
import path from 'path';

import { faker } from '@faker-js/faker';
import type { Credentials } from '@rocket.chat/api-client';
import type {
	IOmnichannelRoom,
	ILivechatVisitor,
	IOmnichannelSystemMessage,
	ILivechatPriority,
	ILivechatDepartment,
	ISubscription,
	IOmnichannelBusinessUnit,
	IUser,
} from '@rocket.chat/core-typings';
import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, afterEach, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import type { SuccessResult } from '../../../../app/api/server/definition';
import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { apps, APP_URL } from '../../../data/apps/apps-data';
import { createCustomField, deleteCustomField } from '../../../data/livechat/custom-fields';
import type { OnlineAgent } from '../../../data/livechat/department';
import {
	createDepartmentWith2OnlineAgents,
	createDepartmentWithAnAwayAgent,
	createDepartmentWithAnOfflineAgent,
	createDepartmentWithAnOnlineAgent,
	deleteDepartment,
} from '../../../data/livechat/department';
import { createSLA, getRandomPriority } from '../../../data/livechat/priorities';
import {
	createVisitor,
	createLivechatRoom,
	createAgent,
	makeAgentAvailable,
	getLivechatRoomInfo,
	sendMessage,
	startANewLivechatRoomAndTakeIt,
	createManager,
	closeOmnichannelRoom,
	createDepartment,
	fetchMessages,
	deleteVisitor,
	makeAgentUnavailable,
	sendAgentMessage,
	fetchInquiry,
	takeInquiry,
} from '../../../data/livechat/rooms';
import { saveTags } from '../../../data/livechat/tags';
import { createMonitor, createUnit, deleteUnit } from '../../../data/livechat/units';
import type { DummyResponse } from '../../../data/livechat/utils';
import { sleep } from '../../../data/livechat/utils';
import {
	restorePermissionToRoles,
	addPermissions,
	removePermissionFromAllRoles,
	updateEEPermission,
	updatePermission,
	updateSetting,
	updateEESetting,
} from '../../../data/permissions.helper';
import { adminUsername, password } from '../../../data/user';
import type { TestUser } from '../../../data/users.helper';
import { createUser, deleteUser, login } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';


describe.only('LIVECHAT - rooms', () => {
	const sockets: WebSocket[] = [];

	before((done) => getCredentials(done));

		it(
			'when manager forward to offline (agent away, accept when agent idle off) department the inquiry should be set to the queue',
			async () => {
				await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
				await updateSetting('Livechat_enabled_when_agent_idle', false);
				const { department: initialDepartment } = await createDepartmentWithAnOnlineAgent();
				const { department: forwardToOfflineDepartment, ws } = await createDepartmentWithAnAwayAgent({
					allowReceiveForwardOffline: true,
				});
				sockets.push(ws);

			},
		);


})

