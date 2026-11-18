import { before, describe, it } from 'node:test';

import { expect } from 'chai';

import { getCredentials, request } from '../../data/api-data';
import { apps } from '../../data/apps/apps-data';
import { createVisitor } from '../../data/livechat/rooms';
import { updateSetting } from '../../data/permissions.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - ui.interaction visitor identity', () => {
	const forgedVisitor = { id: 'victim-visitor', username: 'victim', name: 'Victim', token: 'forged-token' };

	before((_t, done) => getCredentials(done));

	it('should reject a visitor sent in the body without a visitor token', async () => {
		const response = await request
			.post(apps('/ui.interaction/any-app'))
			.send({ type: 'viewSubmit', actionId: 'submit', triggerId: 'trigger', visitor: forgedVisitor, payload: { view: { id: 'view' } } });

		expect(response.status).to.equal(401);
	});

	it('should accept a visitor identified by the visitor token header', async () => {
		await updateSetting('Livechat_enabled', true);
		const visitor = await createVisitor();

		const response = await request
			.post(apps('/ui.interaction/any-app'))
			.set('x-visitor-token', visitor.token)
			.send({ type: 'unknown', triggerId: 'trigger' });

		expect(response.status).to.equal(400);
	});
});
