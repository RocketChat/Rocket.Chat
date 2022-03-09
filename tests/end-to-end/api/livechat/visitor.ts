import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { createVisitor, createLivechatRoom, createAgent } from '../../../data/livechat/rooms.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - visitor', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(() => {
			createAgent()
				.then(() => createVisitor())
				.then(() => done());
		});
	});

	describe('livechat/visitor', () => {


	});
});
