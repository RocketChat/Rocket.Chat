import type { Credentials } from '@rocket.chat/api-client';
import type { IContact, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updateSetting } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE, URL_MONGODB } from '../../e2e/config/constants';

describe('[Contacts]', () => {
	const stamp = Date.now();
	const syncedId = `contacts.synced-${stamp}`;
	const syncedName = `Synced ${stamp}`;

	let connection: MongoClient;
	let ownLocalContactId: string;

	const contacts = () => connection.db().collection<IContact>('rocketchat_contacts');

	const createContact = async (as: Credentials, payload: Record<string, unknown>): Promise<string> => {
		const res = await request.post(api('contacts.create')).set(as).send(payload).expect(200);
		expect(res.body).to.have.property('success', true);
		return res.body.contact._id;
	};

	const listContacts = (query: Record<string, unknown> = {}) =>
		request
			.get(api('contacts.list'))
			.set(credentials)
			.query({ count: 100, ...query });

	before((done) => getCredentials(done));

	before(async () => {
		connection = await MongoClient.connect(URL_MONGODB);

		// No route accepts `source`, on purpose, so the contact the server sync owns is the one that goes in by hand.
		await contacts().insertOne({
			_id: syncedId,
			_updatedAt: new Date(),
			uid: credentials['X-User-Id'],
			source: 'outlook',
			externalId: `contacts.external-${stamp}`,
			folderId: 'default',
			displayName: syncedName,
			emails: [],
			phones: [{ raw: '+541143211000', e164: '+541143211000' }],
		});

		ownLocalContactId = await createContact(credentials, { givenName: `Own${stamp}`, surname: 'Contact' });
	});

	after(async () => {
		await contacts().deleteMany({ _id: { $in: [syncedId, ownLocalContactId] } });
		await connection.close();
	});

	(IS_EE ? describe : describe.skip)('with outlook-calendar license', () => {
		let otherUser: IUser;
		let otherCredentials: Credentials;
		let otherContactId: string;

		before(async () => {
			otherUser = await createUser();
			otherCredentials = await login(otherUser.username, password);
			await updateSetting('Exchange_Contacts_Default_Region', 'AR');
			otherContactId = await createContact(otherCredentials, { givenName: `Other${stamp}`, surname: 'Contact' });
		});

		after(async () => {
			await contacts().deleteMany({ uid: otherUser._id });
			await updateSetting('Exchange_Contacts_Default_Region', '');
			await deleteUser(otherUser);
		});

		describe('[/contacts.create]', () => {
			const created: string[] = [];

			after(() => contacts().deleteMany({ _id: { $in: created } }));

			it('should name a contact after its parts when no display name is given', async () => {
				const res = await request
					.post(api('contacts.create'))
					.set(credentials)
					.send({ givenName: 'John', surname: 'Doe' })
					.expect('Content-Type', 'application/json')
					.expect(200);

				created.push(res.body.contact._id);
				expect(res.body.contact).to.include({ displayName: 'John Doe', source: 'local', uid: credentials['X-User-Id'] });
			});

			it('should key a national number off the configured region, and leave an unresolvable one without a key', async () => {
				const res = await request
					.post(api('contacts.create'))
					.set(credentials)
					.send({
						givenName: 'John',
						phones: [{ raw: '011 4321-1000', label: 'work' }, { raw: 'ext. 204' }],
					})
					.expect(200);

				created.push(res.body.contact._id);
				expect(res.body.contact.phones).to.deep.equal([
					{ raw: '011 4321-1000', e164: '+541143211000', label: 'work' },
					{ raw: 'ext. 204' },
				]);
			});

			it('should refuse a contact with nothing to name it by', async () => {
				await request.post(api('contacts.create')).set(credentials).send({ surname: 'Doe' }).expect(400);
			});
		});

		describe('[/contacts.list]', () => {
			it('should only list the caller own contacts', async () => {
				const res = await listContacts().expect('Content-Type', 'application/json').expect(200);

				const ids = res.body.items.map(({ _id }: IContact) => _id);
				expect(ids).to.include(ownLocalContactId);
				expect(ids).to.not.include(otherContactId);
			});

			it('should count the synced contacts apart from the rest', async () => {
				const res = await listContacts().expect(200);

				expect(res.body.items.map(({ _id }: IContact) => _id)).to.include(syncedId);
				expect(res.body.syncedTotal).to.be.equal(1);
				expect(res.body.syncedTotal).to.be.lessThan(res.body.total);
			});

			it('should find a contact by text', async () => {
				const res = await listContacts({ text: `Own${stamp}` }).expect(200);

				expect(res.body.items.map(({ _id }: IContact) => _id)).to.deep.equal([ownLocalContactId]);
			});

			it('should refuse to sort by a field that is not indexed for it', async () => {
				const res = await listContacts({ sort: JSON.stringify({ uid: 1 }) }).expect(400);

				expect(res.body).to.have.property('error', 'error-invalid-sort-keys');
			});
		});

		describe('[/contacts.update]', () => {
			it('should update a contact the caller owns', async () => {
				await request
					.post(api('contacts.update'))
					.set(credentials)
					.send({ contactId: ownLocalContactId, givenName: `Own${stamp}`, surname: 'Renamed' })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(await contacts().findOne({ _id: ownLocalContactId })).to.include({ displayName: `Own${stamp} Renamed` });
			});

			it('should answer 404 for a contact that belongs to someone else, and leave it as it was', async () => {
				await request.post(api('contacts.update')).set(credentials).send({ contactId: otherContactId, givenName: 'Hijacked' }).expect(404);

				expect(await contacts().findOne({ _id: otherContactId })).to.include({ displayName: `Other${stamp} Contact` });
			});

			it('should answer 404 for a contact the Outlook sync owns, which the next run would overwrite anyway', async () => {
				await request.post(api('contacts.update')).set(credentials).send({ contactId: syncedId, givenName: 'Edited' }).expect(404);

				expect(await contacts().findOne({ _id: syncedId })).to.include({ displayName: syncedName });
			});
		});

		describe('[/contacts.delete]', () => {
			it('should answer 404 for a contact that belongs to someone else, and leave it where it is', async () => {
				await request.post(api('contacts.delete')).set(credentials).send({ contactId: otherContactId }).expect(404);

				expect(await contacts().findOne({ _id: otherContactId })).to.not.be.null;
			});

			it('should answer 404 for a contact the Outlook sync owns, which only the sync may remove', async () => {
				await request.post(api('contacts.delete')).set(credentials).send({ contactId: syncedId }).expect(404);

				expect(await contacts().findOne({ _id: syncedId })).to.not.be.null;
			});

			it('should delete a contact the caller owns', async () => {
				await request
					.post(api('contacts.delete'))
					.set(credentials)
					.send({ contactId: ownLocalContactId })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(await contacts().findOne({ _id: ownLocalContactId })).to.be.null;
			});
		});
	});

	(!IS_EE ? describe : describe.skip)('[without the outlook-calendar license]', () => {
		it('should leave the contacts the sync brought in out of the list', async () => {
			const res = await listContacts().expect('Content-Type', 'application/json').expect(200);

			expect(res.body.items.map(({ _id }: IContact) => _id)).to.not.include(syncedId);
		});

		it('should still list the contacts the user created', async () => {
			const res = await listContacts().expect(200);

			expect(res.body.items.map(({ _id }: IContact) => _id)).to.include(ownLocalContactId);
		});

		it('should report no synced contacts at all, rather than a count nothing backs', async () => {
			const res = await listContacts().expect(200);

			expect(res.body.syncedTotal).to.be.equal(0);
		});

		it('should not reach a synced contact through the search either', async () => {
			const res = await listContacts({ text: syncedName }).expect(200);

			expect(res.body.items).to.be.an('array').that.is.empty;
		});
	});
});
