import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { api, credentials, getCredentials, request } from '../../data/api-data';
import { adminUsername, password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('AI Search', () => {
	before((done) => getCredentials(done));

	describe('[/ai.search]', () => {
		it('should fail when query is missing', async () => {
			const response = await request.get(api('ai.search')).set(credentials);

			expect(response.status).to.equal(400);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error');
		});

		it('should return the AI search response shape for authenticated users', async () => {
			const response = await request.get(api('ai.search')).query({ query: adminUsername, intelligentCount: 8 }).set(credentials);

			expect(response.status).to.equal(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('intelligent').that.is.an('array');
			expect(response.body).to.have.property('meta');
			expect(response.body.meta).to.include.keys(['intelligentSearchEnabled', 'intelligentSearchConfigured', 'answerGenerationConfigured']);
		});
	});

	describe('[/ai.search.answer]', () => {
		it('should fail when not authenticated', async () => {
			const response = await request
				.post(api('ai.search.answer'))
				.send({ query: 'example question', messages: [{ _id: 'example-message-id' }] });

			expect(response.status).to.equal(401);
		});

		it('should reject answer generation without source messages', async () => {
			const response = await request.post(api('ai.search.answer')).set(credentials).send({ query: 'example question', messages: [] });

			expect(response.status).to.equal(400);
			expect(response.body).to.have.property('success', false);
		});
	});

	describe('[/ai.llm.models]', () => {
		let user: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
		});

		after(() => deleteUser(user));

		it('should fail when not authenticated', async () => {
			const response = await request.get(api('ai.llm.models'));

			expect(response.status).to.equal(401);
		});

		it('should fail for users without settings permissions', async () => {
			const response = await request.get(api('ai.llm.models')).set(userCredentials);

			expect(response.status).to.equal(403);
			expect(response.body).to.have.property('success', false);
		});

		it('should return model options for authorized users', async () => {
			const response = await request.get(api('ai.llm.models')).set(credentials);

			expect(response.status).to.equal(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('data').that.is.an('array');
		});
	});
});
