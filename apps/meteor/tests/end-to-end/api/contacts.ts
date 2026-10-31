import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IContact, ISetting, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { MongoClient } from 'mongodb';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { getSettingValueById, updateSetting } from '../../data/permissions.helper';
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

	before((_t, done) => getCredentials(done));

	before(async () => {
		connection = await MongoClient.connect(URL_MONGODB);

		// No route accepts `source` or `syncProvider`, on purpose, so the contact the server sync owns is the one that goes in by hand.
		await contacts().insertOne({
			_id: syncedId,
			_updatedAt: new Date(),
			uid: credentials['X-User-Id'],
			source: 'outlook',
			syncProvider: 'ews',
			externalId: `contacts.external-${stamp}`,
			folderId: 'default',
			displayName: syncedName,
			emails: [],
			phones: [{ raw: '+541143211000', e164: '+541143211000' }],
		});

		ownLocalContactId = await createContact(credentials, { givenName: `Own${stamp}`, surname: 'Contact' });
	});

	after(async () => {
		if (connection) {
			await contacts().deleteMany({ _id: { $in: [syncedId, ownLocalContactId] } });
			await connection.close();
		}
	});

	(IS_EE ? describe : describe.skip)('with outlook-calendar license', () => {
		let otherUser: IUser;
		let otherCredentials: Credentials;
		let otherContactId: string;
		let previousRegion: ISetting['value'];

		before(async () => {
			otherUser = await createUser();
			otherCredentials = await login(otherUser.username, password);
			previousRegion = await getSettingValueById('Exchange_Contacts_Default_Region');
			await updateSetting('Exchange_Contacts_Default_Region', 'AR');
			otherContactId = await createContact(otherCredentials, { givenName: `Other${stamp}`, surname: 'Contact' });
		});

		after(async () => {
			await contacts().deleteMany({ uid: otherUser._id });
			await updateSetting('Exchange_Contacts_Default_Region', previousRegion);
			await deleteUser(otherUser);
		});

		describe('[/contacts.create]', () => {
			const created: string[] = [];

			after(() => contacts().deleteMany({ _id: { $in: created } }));

			it('should name a contact after its parts, which is the only way it gets a name', async () => {
				const res = await request
					.post(api('contacts.create'))
					.set(credentials)
					.send({ givenName: 'John', surname: 'Doe' })
					.expect('Content-Type', 'application/json')
					.expect(200);

				created.push(res.body.contact._id);
				expect(res.body.contact).to.include({ displayName: 'John Doe', source: 'local' });
				expect(res.body.contact).to.not.have.property('uid');
			});

			it('should ignore the configured region, which only keys the numbers Exchange syncs', async () => {
				const res = await request
					.post(api('contacts.create'))
					.set(credentials)
					.send({
						givenName: 'John',
						phones: [{ raw: '+54 11 4321-1000', label: 'work' }, { raw: '011 4321-1000' }, { raw: 'ext. 204' }],
					})
					.expect(200);

				created.push(res.body.contact._id);
				expect(res.body.contact.phones).to.deep.equal([
					{ raw: '+54 11 4321-1000', e164: '+541143211000', label: 'work' },
					{ raw: '011 4321-1000' },
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

		describe('[/contacts.info]', () => {
			const getContact = (as: Credentials, contactId: string) => request.get(api('contacts.info')).set(as).query({ contactId });

			it('should answer with a contact the caller owns', async () => {
				const res = await getContact(credentials, ownLocalContactId).expect('Content-Type', 'application/json').expect(200);

				expect(res.body.contact).to.include({ _id: ownLocalContactId, source: 'local' });
			});

			it('should answer with a contact the sync owns, which the caller may read even without owning the folder', async () => {
				const res = await getContact(credentials, syncedId).expect(200);

				expect(res.body.contact).to.include({ _id: syncedId, displayName: syncedName, source: 'outlook' });
			});

			it('should answer 404 for a contact that belongs to someone else', async () => {
				await getContact(credentials, otherContactId).expect(404);
			});

			it('should answer 404 for a contact that does not exist', async () => {
				await getContact(credentials, `contacts.absent-${stamp}`).expect(404);
			});

			it('should leave out the fields only the sync reads', async () => {
				const res = await getContact(credentials, syncedId).expect(200);

				expect(res.body.contact).to.not.have.any.keys('uid', 'externalId', 'folderId', 'lastSyncAt');
			});
		});

		describe('[/contacts.update]', () => {
			it('should update a contact the caller owns', async () => {
				const res = await request
					.post(api('contacts.update'))
					.set(credentials)
					.send({ contactId: ownLocalContactId, givenName: `Own${stamp}`, surname: 'Renamed' })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(res.body.contact).to.include({ _id: ownLocalContactId, displayName: `Own${stamp} Renamed` });
				expect(await contacts().findOne({ _id: ownLocalContactId })).to.include({ displayName: `Own${stamp} Renamed` });
			});

			it('should shrink the name back when the part it was built from goes away', async () => {
				await request
					.post(api('contacts.update'))
					.set(credentials)
					.send({ contactId: ownLocalContactId, givenName: `Own${stamp}` })
					.expect(200);

				const stored = await contacts().findOne({ _id: ownLocalContactId });

				expect(stored).to.include({ displayName: `Own${stamp}` });
				expect(stored).to.not.have.property('surname');
			});

			it('should answer 404 for a contact that belongs to someone else, and leave it as it was', async () => {
				const res = await request
					.post(api('contacts.update'))
					.set(credentials)
					.send({ contactId: otherContactId, givenName: 'Hijacked' })
					.expect(404);

				expect(res.body).to.have.property('error', 'error-contact-not-found');
				expect(await contacts().findOne({ _id: otherContactId })).to.include({ displayName: `Other${stamp} Contact` });
			});

			it('should answer 404 for a contact the Outlook sync owns, which the next run would overwrite anyway', async () => {
				const res = await request
					.post(api('contacts.update'))
					.set(credentials)
					.send({ contactId: syncedId, givenName: 'Edited' })
					.expect(404);

				expect(res.body).to.have.property('error', 'error-contact-not-found');
				expect(await contacts().findOne({ _id: syncedId })).to.include({ displayName: syncedName });
			});
		});

		describe('[/contacts.favorite]', () => {
			const graphContactId = `contacts.graph-${stamp}`;
			let favoriteId: string;

			const listFavoriteIds = async () => {
				const res = await listContacts({ favorite: true }).expect(200);
				return res.body.items.map(({ _id }: IContact) => _id);
			};

			before(async () => {
				favoriteId = await createContact(credentials, { givenName: `zFavorite${stamp}` });
				await request.post(api('contacts.favorite')).set(credentials).send({ contactId: favoriteId, favorite: true }).expect(200);
				await contacts().insertOne({
					_id: graphContactId,
					_updatedAt: new Date(),
					uid: credentials['X-User-Id'],
					source: 'outlook',
					syncProvider: 'graph',
					externalId: `contacts.graph-external-${stamp}`,
					folderId: 'default',
					displayName: `Graph ${stamp}`,
					emails: [],
					phones: [],
				});
			});

			after(async () => {
				await contacts().deleteMany({ _id: { $in: [favoriteId, graphContactId] } });
				await request.post(api('contacts.favorite')).set(credentials).send({ contactId: ownLocalContactId, favorite: false }).expect(200);
			});

			it('should list the favorites first when sorting by them, ahead of contacts named before them', async () => {
				const byName = await listContacts().expect(200);
				const byFavorite = await listContacts({ sort: JSON.stringify({ favorite: -1 }) }).expect(200);

				expect(byName.body.items[0]._id).to.not.equal(favoriteId);
				expect(byFavorite.body.items[0]).to.have.property('_id', favoriteId);
			});

			it('should mark a contact the caller owns as favorite, and list it among the favorites and the opposite when unfavorited', async () => {
				await request.post(api('contacts.favorite')).set(credentials).send({ contactId: ownLocalContactId, favorite: true }).expect(200);

				expect(await contacts().findOne({ _id: ownLocalContactId })).to.include({ favorite: true });
				expect(await listFavoriteIds()).to.include(ownLocalContactId);

				await request.post(api('contacts.favorite')).set(credentials).send({ contactId: ownLocalContactId, favorite: false }).expect(200);

				expect(await contacts().findOne({ _id: ownLocalContactId })).to.not.have.property('favorite');
				expect(await listFavoriteIds()).to.not.include(ownLocalContactId);
			});

			it('should answer 404 for a contact that belongs to someone else, and leave it as it was', async () => {
				const res = await request
					.post(api('contacts.favorite'))
					.set(credentials)
					.send({ contactId: otherContactId, favorite: true })
					.expect(404);

				expect(res.body).to.have.property('error', 'error-contact-not-found');
				expect(await contacts().findOne({ _id: otherContactId })).to.not.have.property('favorite');
			});

			it('should let the caller mark a contact synced from Graph, which cannot read the favorite in Outlook', async () => {
				await request.post(api('contacts.favorite')).set(credentials).send({ contactId: graphContactId, favorite: true }).expect(200);

				expect(await contacts().findOne({ _id: graphContactId })).to.include({ favorite: true });

				await request.post(api('contacts.favorite')).set(credentials).send({ contactId: graphContactId, favorite: false }).expect(200);

				expect(await contacts().findOne({ _id: graphContactId })).to.not.have.property('favorite');
			});

			it('should answer 404 for a contact synced from EWS, whose favorite state comes from Outlook', async () => {
				const res = await request.post(api('contacts.favorite')).set(credentials).send({ contactId: syncedId, favorite: true }).expect(404);

				expect(res.body).to.have.property('error', 'error-contact-not-found');
				expect(await contacts().findOne({ _id: syncedId })).to.not.have.property('favorite');
			});
		});

		describe('[/contacts.delete]', () => {
			it('should answer 404 for a contact that belongs to someone else, and leave it where it is', async () => {
				const res = await request.post(api('contacts.delete')).set(credentials).send({ contactId: otherContactId }).expect(404);

				expect(res.body).to.have.property('error', 'error-contact-not-found');
				expect(await contacts().findOne({ _id: otherContactId })).to.not.be.null;
			});

			it('should answer 404 for a contact the Outlook sync owns, which only the sync may remove', async () => {
				const res = await request.post(api('contacts.delete')).set(credentials).send({ contactId: syncedId }).expect(404);

				expect(res.body).to.have.property('error', 'error-contact-not-found');
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
		describe('[/contacts.list]', () => {
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

		describe('[/contacts.info]', () => {
			it('should answer 404 for a synced contact asked for by id', async () => {
				await request.get(api('contacts.info')).set(credentials).query({ contactId: syncedId }).expect(404);
			});

			it('should still answer for a contact the user created', async () => {
				const res = await request.get(api('contacts.info')).set(credentials).query({ contactId: ownLocalContactId }).expect(200);

				expect(res.body.contact).to.include({ _id: ownLocalContactId, source: 'local' });
			});
		});
	});
});
