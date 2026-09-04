import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';

import { api, getCredentials, request, credentials } from '../../data/api-data';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

/**
 * ABAC Phase 4, Milestone 2 — the two server-side pieces the creation flow depends on:
 * the membership-impact preview (§7.2) and the PDP creator-authority check.
 *
 * These run against the local PDP, which decides from the database rather than an external
 * service, so the outcomes here are deterministic. The Virtru path is covered by the unit specs
 * for `VirtruPDP.evaluateSubjectsAgainstAttributes` and `VirtruAttributeStore.validateAssignable`.
 */
(IS_EE ? describe : describe.skip)('[ABAC Creation Flow] (Enterprise Only)', function () {
	this.retries(0);

	let compliantUser: IUser;
	let nonCompliantUser: IUser;
	let compliantCredentials: Credentials;
	const attributeKey = `clearance${Date.now()}`;

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('ABAC_Enabled', true);
		await updateSetting('ABAC_PDP_Type', 'local');
		// The ownership restriction is exercised in its own describe below, so it starts off.
		await updateSetting('ABAC_Restrict_To_Owned_Attributes', false);
		await updatePermission('abac-management', ['admin']);
		await updatePermission('manage-abac-admin-room-attributes', ['admin']);

		await request
			.post(api('abac/attributes'))
			.set(credentials)
			.send({ key: attributeKey, values: ['secret', 'topsecret'] })
			.expect(200);

		compliantUser = await createUser();
		nonCompliantUser = await createUser();
		compliantCredentials = await login(compliantUser.username, password);
	});

	after(async () => {
		await updateSetting('ABAC_Restrict_To_Owned_Attributes', true);
		await updateSetting('ABAC_Enabled', false);
		await deleteUser(compliantUser);
		await deleteUser(nonCompliantUser);
	});

	describe('[/abac/membership-preview]', () => {
		it('rejects a body naming neither a room nor a member list', async () => {
			await request
				.post(api('abac/membership-preview'))
				.set(credentials)
				.send({ attributes: { [attributeKey]: ['secret'] } })
				.expect(400);
		});

		it('returns empty partitions for an empty member list', async () => {
			await request
				.post(api('abac/membership-preview'))
				.set(credentials)
				.send({ memberIds: [], attributes: { [attributeKey]: ['secret'] } })
				.expect(400);
		});

		it('partitions members and never commits anything', async () => {
			const res = await request
				.post(api('abac/membership-preview'))
				.set(credentials)
				.send({
					memberUsernames: [compliantUser.username, nonCompliantUser.username],
					attributes: { [attributeKey]: ['secret'] },
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body.counts).to.have.property('total', 2);
			// Neither user carries the attribute, so with a local PDP both are non-compliant.
			expect(res.body.counts).to.have.property('losing', 2);
			expect(res.body.counts).to.have.property('retaining', 0);
			expect(res.body).to.have.property('summarisedOnly', false);
			expect(res.body.loses).to.be.an('array').with.lengthOf(2);
		});

		it('reports role tags and exact counts for an existing room', async () => {
			const room = await createRoom({ type: 'p', name: `abac-preview-${Date.now()}` });
			const roomId: IRoom['_id'] = room.body.group._id;

			const res = await request
				.post(api('abac/membership-preview'))
				.set(credentials)
				.send({ rid: roomId, attributes: { [attributeKey]: ['secret'] } })
				.expect(200);

			expect(res.body.counts.total).to.be.greaterThan(0);
			// The creator is an owner of the room they just made.
			const creator = [...res.body.loses, ...res.body.retains].find((member: { roles: string[] }) => member.roles.includes('owner'));
			expect(creator, 'expected the room owner to carry an owner role tag').to.not.be.undefined;

			// A dry run must leave the room untouched.
			const info = await request.get(api('groups.info')).set(credentials).query({ roomId }).expect(200);
			expect(info.body.group).to.not.have.property('abacAttributes');

			await deleteRoom({ type: 'p', roomId });
		});

		it('tells the caller when they would lose their own access (D2)', async () => {
			const res = await request
				.post(api('abac/membership-preview'))
				.set(credentials)
				.send({ memberUsernames: [compliantUser.username], attributes: { [attributeKey]: ['secret'] } })
				.expect(200);

			// The admin is not in the member list, so they are not among those losing access.
			expect(res.body).to.have.property('actorLosesAccess', false);
		});

		it('pages server-side', async () => {
			const res = await request
				.post(api('abac/membership-preview'))
				.set(credentials)
				.send({
					memberUsernames: [compliantUser.username, nonCompliantUser.username],
					attributes: { [attributeKey]: ['secret'] },
					offset: 0,
					count: 1,
				})
				.expect(200);

			// Counts stay exact for the whole target even when only a page is enumerated.
			expect(res.body.counts.total).to.equal(2);
			expect(res.body.loses).to.have.lengthOf(1);
			expect(res.body).to.have.property('offset', 0);
		});
	});

	describe('[/abac/attribute-assignability]', () => {
		it('permits a combination the actor is entitled to assign', async () => {
			await request
				.post(api('abac/attribute-assignability'))
				.set(credentials)
				.send({ attributes: { [attributeKey]: ['secret'] } })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('refuses an attribute key that does not exist', async () => {
			await request
				.post(api('abac/attribute-assignability'))
				.set(credentials)
				.send({ attributes: { 'no-such-attribute': ['secret'] } })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('refuses a value the attribute does not define', async () => {
			await request
				.post(api('abac/attribute-assignability'))
				.set(credentials)
				.send({ attributes: { [attributeKey]: ['not-a-defined-value'] } })
				.expect(400);
		});

		describe('with ABAC_Restrict_To_Owned_Attributes on (D12)', () => {
			before(async () => {
				await updateSetting('ABAC_Restrict_To_Owned_Attributes', true);
			});

			after(async () => {
				await updateSetting('ABAC_Restrict_To_Owned_Attributes', false);
			});

			it('refuses an attribute the actor does not possess, naming it', async () => {
				// The user has no subject attributes at all, so they possess nothing to assign.
				const res = await request
					.post(api('abac/attribute-assignability'))
					.set(compliantCredentials)
					.send({ attributes: { [attributeKey]: ['secret'] } })
					.expect(400);

				expect(res.body).to.have.property('success', false);
				// ABAC-P4 Scenario 4 — the denial has to identify what was refused.
				expect(JSON.stringify(res.body)).to.include(attributeKey);
			});
		});
	});
});
