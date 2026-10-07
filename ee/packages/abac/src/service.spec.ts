import type { AbacRoomAttributesGrant, AbacRoomMembershipPreviewPage } from '@rocket.chat/core-services';

import { Audit } from './audit';
import { VirtruClient } from './clients/virtru/VirtruClient';
import {
	AbacEntityResolutionFailedError,
	AbacInvalidAttributeValuesError,
	OnlyCompliantCanBeAddedToRoomError,
	PdpUnavailableError,
} from './errors';
import { AbacService } from './index';
import { LocalAttributeStore, VirtruAttributeStore } from './store';

const mockSettingsGet = jest.fn();
const mockHasModule = jest.fn();
const mockHasPermission = jest.fn();

jest.mock('./store', () => {
	const { ensureAttributeDefinitionsExist } = jest.requireActual('./helper');
	return {
		LocalAttributeStore: jest.fn().mockImplementation(() => ({
			assertCanModifyRoom: jest.fn().mockResolvedValue(undefined),
			validateAssignable: (attrs: any[], _actor: any) => ensureAttributeDefinitionsExist(attrs),
			scopeRoomsPage: (rooms: any[]) => Promise.resolve(rooms),
		})),
		VirtruAttributeStore: jest.fn().mockImplementation(() => ({
			onStoreSelected: jest.fn(),
		})),
	};
});

jest.mock('./clients/virtru/VirtruClient', () => ({
	VirtruClient: jest.fn().mockImplementation(() => ({
		updateConfig: jest.fn(),
		getConfig: jest.fn(() => ({})),
		isAvailable: jest.fn(),
		apiCall: jest.fn(),
	})),
}));

const fakeActor = { _id: 'test-user', username: 'testuser', type: 'user' };

const mockFindOneByIdAndType = jest.fn();
const mockAbacInsertOne = jest.fn();
const mockAbacFindPaginated = jest.fn();
const mockAbacFindOne = jest.fn();
const mockAbacUpdateOne = jest.fn();
const mockAbacDeleteOne = jest.fn();
const mockRoomsIsAbacAttributeInUse = jest.fn();
const mockRoomsFindPaginated = jest.fn();
const mockSetAbacAttributesById = jest.fn();
const mockAbacFind = jest.fn();
const mockUpdateSingleAbacAttributeValuesById = jest.fn();
const mockUpdateAbacAttributeValuesArrayFilteredById = jest.fn();
const mockRemoveAbacAttributeByRoomIdAndKey = jest.fn();
const mockInsertAbacAttributeIfNotExistsById = jest.fn();
const mockUnsetAbacAttributesById = jest.fn();
const mockRoomsUnsetAllAbacAttributes = jest.fn();
const mockSettingsSet = jest.fn();
const mockUsersFind = jest.fn();
const mockUsersFindOneById = jest.fn();
const mockUsersFindOne = jest.fn();
const mockUsersUpdateOne = jest.fn();
const mockUsersSetAbacAttributesById = jest.fn();
const mockUsersUnsetAbacAttributesById = jest.fn();
const mockAbacFindOneAndUpdate = jest.fn();
const mockCreateAuditServerEvent = jest.fn();
const mockCreateAuditServerEvents = jest.fn();
const mockRoomsFindAllPrivateAbac = jest.fn();
const mockUsersFindActiveByRoomIds = jest.fn();
const mockRoomRemoveUserFromRoom = jest.fn();
const mockSaveSystemMessage = jest.fn();
const mockUsersFindUsersByIdentifiers = jest.fn();
const mockLdapSyncByIds = jest.fn();
const mockSubscriptionsFindByRoomIdAndUserIds = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Rooms: {
		findOneByIdAndType: (...args: any[]) => mockFindOneByIdAndType(...args),
		isAbacAttributeInUse: (...args: any[]) => mockRoomsIsAbacAttributeInUse(...args),
		findPaginated: (...args: any[]) => mockRoomsFindPaginated(...args),
		setAbacAttributesById: (...args: any[]) => mockSetAbacAttributesById(...args),
		updateSingleAbacAttributeValuesById: (...args: any[]) => mockUpdateSingleAbacAttributeValuesById(...args),
		updateAbacAttributeValuesArrayFilteredById: (...args: any[]) => mockUpdateAbacAttributeValuesArrayFilteredById(...args),
		removeAbacAttributeByRoomIdAndKey: (...args: any[]) => mockRemoveAbacAttributeByRoomIdAndKey(...args),
		insertAbacAttributeIfNotExistsById: (...args: any[]) => mockInsertAbacAttributeIfNotExistsById(...args),
		unsetAbacAttributesById: (...args: any[]) => mockUnsetAbacAttributesById(...args),
		unsetAllAbacAttributes: (...args: any[]) => mockRoomsUnsetAllAbacAttributes(...args),
		findAllPrivateRoomsWithAbacAttributes: (...args: any[]) => mockRoomsFindAllPrivateAbac(...args),
	},
	AbacAttributes: {
		insertOne: (...args: any[]) => mockAbacInsertOne(...args),
		findPaginated: (...args: any[]) => mockAbacFindPaginated(...args),
		findOne: (...args: any[]) => mockAbacFindOne(...args),
		findOneById: (...args: any[]) => mockAbacFindOne(...args), // map findOneById calls to same mock
		findOneByKey: (...args: any[]) => mockAbacFindOne(...args), // map findOneByKey to same mock
		updateOne: (...args: any[]) => mockAbacUpdateOne(...args),
		findOneAndUpdate: (...args: any[]) => mockAbacFindOneAndUpdate(...args),
		deleteOne: (...args: any[]) => mockAbacDeleteOne(...args),
		removeById: (...args: any[]) => mockAbacDeleteOne(...args),
		find: (...args: any[]) => mockAbacFind(...args),
	},
	Users: {
		find: (...args: any[]) => mockUsersFind(...args),
		findOneById: (...args: any[]) => mockUsersFindOneById(...args),
		findOne: (...args: any[]) => mockUsersFindOne(...args),
		findActiveByRoomIds: (...args: any[]) => mockUsersFindActiveByRoomIds(...args),
		findUsersByIdentifiers: (...args: any[]) => mockUsersFindUsersByIdentifiers(...args),
		setAbacAttributesById: (...args: any[]) => mockUsersSetAbacAttributesById(...args),
		unsetAbacAttributesById: (...args: any[]) => mockUsersUnsetAbacAttributesById(...args),
		findOneAndUpdate: (...args: any[]) => mockUsersUpdateOne(...args),
		updateOne: (...args: any[]) => mockUsersUpdateOne(...args),
	},
	ServerEvents: {
		createAuditServerEvent: async (...args: any[]) => mockCreateAuditServerEvent(...args),
		createAuditServerEvents: async (...args: any[]) => mockCreateAuditServerEvents(...args),
	},
	Settings: {
		updateValueById: (...args: any[]) => mockSettingsSet(...args),
	},
	Subscriptions: {
		findByRoomIdAndUserIds: (...args: any[]) => mockSubscriptionsFindByRoomIdAndUserIds(...args),
	},
}));

// Partial mock for @rocket.chat/core-services: keep real MeteorError, override ServiceClass and Room
jest.mock('@rocket.chat/core-services', () => {
	const actual = jest.requireActual('@rocket.chat/core-services');
	return {
		...actual,
		ServiceClass: class {
			onSettingChanged = jest.fn();

			onEvent = jest.fn();
		},
		Room: {
			removeUserFromRoom: (...args: any[]) => mockRoomRemoveUserFromRoom(...args),
		},
		Message: {
			saveSystemMessage: (...args: any[]) => mockSaveSystemMessage(...args),
		},
		LDAPEnterprise: {
			syncUsersAbacAttributesByIds: (...args: any[]) => mockLdapSyncByIds(...args),
		},
		api: {
			broadcast: jest.fn(),
		},
		Settings: {
			get: (...args: any[]) => mockSettingsGet(...args),
			set: (...args: any[]) => mockSettingsSet(...args),
		},
		License: {
			hasModule: (...args: any[]) => mockHasModule(...args),
		},
		Authorization: {
			hasPermission: (...args: any[]) => mockHasPermission(...args),
		},
	};
});

const auditedEvents = () => mockCreateAuditServerEvents.mock.calls.flatMap(([events]: any[]) => events);

jest.mock('mem', () => {
	return jest.fn((fn: any) => fn);
});

describe('AbacService (unit)', () => {
	let service: AbacService;

	beforeEach(() => {
		service = new AbacService();
		service.setPdpStrategy('local');
		jest.clearAllMocks();
	});

	const evaluateRemovalsToo = () =>
		jest.spyOn((service as any).pdp, 'needsEvaluation').mockImplementation(({ added, removed }: any) => added || removed);

	describe('addSubjectAttributes (merging behavior)', () => {
		const getUpdatedAttributesFromCall = () => {
			const last = mockUsersSetAbacAttributesById.mock.calls.at(-1);
			return last?.[1] as any[] | undefined;
		};

		it('merges values from multiple LDAP keys mapping to the same ABAC key', async () => {
			const user = { _id: 'u1' } as any;
			const ldapUser = {
				memberOf: ['eng', 'sales'],
				department: ['sales', 'support'],
			} as any;

			const map = {
				memberOf: 'dept',
				department: 'dept',
			};

			await service.addSubjectAttributes(user, ldapUser, map);

			expect(mockUsersSetAbacAttributesById).toHaveBeenCalledTimes(1);
			const final = getUpdatedAttributesFromCall();
			expect(final).toBeDefined();
			expect(final).toHaveLength(1);
			expect(final?.[0].key).toBe('dept');
			expect(final?.[0].values).toEqual(['eng', 'sales', 'support']);
		});

		it('deduplicates values across different LDAP keys and within arrays', async () => {
			const user = { _id: 'u2' } as any;
			const ldapUser = {
				group: ['alpha', 'beta', 'alpha'],
				team: ['beta', 'gamma'],
				role: 'gamma',
			} as any;

			const map = {
				group: 'combined',
				team: 'combined',
				role: 'combined',
			};

			await service.addSubjectAttributes(user, ldapUser, map);

			const final = getUpdatedAttributesFromCall();
			expect(final?.[0].values).toEqual(['alpha', 'beta', 'gamma']);
		});

		it('unsets abacAttributes when no LDAP values are found and user previously had attributes', async () => {
			const user = {
				_id: 'u3',
				abacAttributes: [{ key: 'dept', values: ['eng'] }],
			} as any;
			const ldapUser = {
				other: ['x'],
			} as any;

			const map = {
				memberOf: 'dept',
			};

			await service.addSubjectAttributes(user, ldapUser, map);

			// This call is noop cause user doesnt have a __rooms property
			expect(mockUsersUnsetAbacAttributesById).toHaveBeenCalledTimes(1);
		});

		it('does nothing when no LDAP values are found and user had no previous attributes', async () => {
			const user = { _id: 'u4' } as any;
			const ldapUser = {} as any;
			const map = { missing: 'dept' };

			await service.addSubjectAttributes(user, ldapUser, map);

			expect(mockUsersSetAbacAttributesById).not.toHaveBeenCalled();
			expect(mockUsersUnsetAbacAttributesById).not.toHaveBeenCalled();
		});

		it('calls onSubjectAttributesChanged when user loses an attribute value', async () => {
			const user = {
				_id: 'u5',
				abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }],
			} as any;
			const ldapUser = {
				memberOf: ['eng'],
			} as any;
			const map = { memberOf: 'dept' };

			const spy = jest.spyOn<any, any>(service as any, 'onSubjectAttributesChanged');

			await service.addSubjectAttributes(user, ldapUser, map);

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][1]).toEqual([{ key: 'dept', values: ['eng'] }]);
		});

		it('does not call onSubjectAttributesChanged when only gaining new values', async () => {
			const user = {
				_id: 'u6',
				abacAttributes: [{ key: 'dept', values: ['eng'] }],
			} as any;
			const ldapUser = {
				memberOf: ['eng', 'qa'],
			} as any;
			const map = { memberOf: 'dept' };

			const spy = jest.spyOn<any, any>(service as any, 'onSubjectAttributesChanged');

			await service.addSubjectAttributes(user, ldapUser, map);

			expect(spy).not.toHaveBeenCalled();
		});

		it('calls onSubjectAttributesChanged when an entire attribute key is lost', async () => {
			const user = {
				_id: 'u7',
				abacAttributes: [
					{ key: 'dept', values: ['eng'] },
					{ key: 'region', values: ['emea'] },
				],
			} as any;
			const ldapUser = {
				department: ['eng'],
			} as any;
			const map = { department: 'dept' };

			const spy = jest.spyOn<any, any>(service as any, 'onSubjectAttributesChanged');

			await service.addSubjectAttributes(user, ldapUser, map);

			// This call is noop cause user doesnt have a __rooms property
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][1]).toEqual([{ key: 'dept', values: ['eng'] }]);
		});

		it('supports mixing array and string LDAP values merging into one ABAC attribute', async () => {
			const user = { _id: 'u8' } as any;
			const ldapUser = {
				deptCode: 'eng',
				deptName: ['engineering', 'eng'],
			} as any;
			const map = { deptCode: 'dept', deptName: 'dept' };

			await service.addSubjectAttributes(user, ldapUser, map);

			const final = getUpdatedAttributesFromCall();
			expect(final?.[0].key).toBe('dept');
			expect(final?.[0].values).toEqual(['eng', 'engineering']);
		});

		it('ignores empty string values and unsets when all values invalid and user had attributes', async () => {
			const user = { _id: 'u9', abacAttributes: [{ key: 'dept', values: ['eng'] }] } as any;
			const ldapUser = {
				memberOf: ['', '   ', null],
				department: '',
			} as any;
			const map = { memberOf: 'dept', department: 'dept' };

			const spy = jest.spyOn<any, any>(service as any, 'onSubjectAttributesChanged');
			await service.addSubjectAttributes(user, ldapUser, map);

			expect(mockUsersUnsetAbacAttributesById).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][1]).toEqual([]);
		});
	});

	describe('addAbacAttribute', () => {
		it('inserts attribute when valid', async () => {
			const attribute = { key: 'Valid_Key-1', values: ['v1', 'v2'] };
			await service.addAbacAttribute(attribute, fakeActor);
			expect(mockAbacInsertOne).toHaveBeenCalledTimes(1);
			expect(mockAbacInsertOne).toHaveBeenCalledWith(attribute);
		});

		it('accepts key with spaces (no key pattern validation in service)', async () => {
			const attribute = { key: 'Invalid Key!', values: ['v1'] };
			await service.addAbacAttribute(attribute as any, fakeActor);
			expect(mockAbacInsertOne).toHaveBeenCalledWith(attribute);
		});

		it('throws error-invalid-attribute-values for empty values array', async () => {
			const attribute = { key: 'ValidKey', values: [] as string[] };
			await expect(service.addAbacAttribute(attribute, fakeActor)).rejects.toThrow('error-invalid-attribute-values');
			expect(mockAbacInsertOne).not.toHaveBeenCalled();
		});

		it('throws error-duplicate-attribute-key when duplicate index error occurs', async () => {
			const attribute = { key: 'DupKey', values: ['a'] };
			mockAbacInsertOne.mockRejectedValueOnce(new Error('E11000 duplicate key error collection: abac_attributes'));
			await expect(service.addAbacAttribute(attribute, fakeActor)).rejects.toThrow('error-duplicate-attribute-key');
		});

		it('propagates unexpected insert errors', async () => {
			const attribute = { key: 'OtherKey', values: ['x'] };
			mockAbacInsertOne.mockRejectedValueOnce(new Error('network-failure'));
			await expect(service.addAbacAttribute(attribute, fakeActor)).rejects.toThrow('network-failure');
		});
	});

	describe('listAbacAttributes', () => {
		const actor = { _id: 'admin-1', username: 'admin', name: 'Admin' };

		it('delegates to attributeStore.list with the given filters and actor', async () => {
			const result = { attributes: [{ _id: 'k', key: 'k', values: ['v'] }], offset: 0, count: 1, total: 1 };
			const fakeStore = { list: jest.fn().mockResolvedValue(result) };
			(service as any).attributeStores.local.store = fakeStore;

			const filters = { key: 'k', values: 'v', offset: 0, count: 25 };
			const returned = await service.listAbacAttributes(filters, actor);

			expect(fakeStore.list).toHaveBeenCalledWith(actor, filters);
			expect(returned).toBe(result);
			expect(mockAbacFindPaginated).not.toHaveBeenCalled();
		});
	});

	describe('listAbacAttributeKeys', () => {
		const actor = { _id: 'admin-1', username: 'admin', name: 'Admin' };

		it('delegates to attributeStore.listAttributeKeys with the actor', async () => {
			const fakeStore = { listAttributeKeys: jest.fn().mockResolvedValue(['clearance', 'team']) };
			(service as any).attributeStores.local.store = fakeStore;

			await expect(service.listAbacAttributeKeys(actor)).resolves.toEqual(['clearance', 'team']);
			expect(fakeStore.listAttributeKeys).toHaveBeenCalledWith(actor);
		});
	});

	describe('updateAbacAttributeById', () => {
		beforeEach(() => {
			mockAbacFindOne.mockReset();
			mockAbacUpdateOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
		});

		it('returns early (no-op) when neither key nor values provided', async () => {
			await service.updateAbacAttributeById('id1', {} as any, fakeActor);
			expect(mockAbacFindOne).not.toHaveBeenCalled();
			expect(mockAbacUpdateOne).not.toHaveBeenCalled();
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
		});

		it('throws error-attribute-not-found when attribute does not exist', async () => {
			mockAbacFindOne.mockResolvedValueOnce(null);
			await expect(service.updateAbacAttributeById('idMissing', { key: 'newKey' }, fakeActor)).rejects.toThrow('error-attribute-not-found');
			expect(mockAbacFindOne).toHaveBeenCalledWith('idMissing', { projection: { key: 1, values: 1 } });
		});

		it('updates key even if format contains spaces (no validation in service)', async () => {
			mockAbacFindOne
				.mockResolvedValueOnce({ _id: 'id2', key: 'OldKey', values: ['a'] }) // findOneById
				.mockResolvedValueOnce(null); // duplicate key check
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			await service.updateAbacAttributeById('id2', { key: 'Invalid Key!' }, fakeActor);
			expect(mockAbacUpdateOne).toHaveBeenCalledWith({ _id: 'id2' }, { $set: { key: 'Invalid Key!' } });
		});

		it('throws error-invalid-attribute-values for empty values array', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacUpdateOne.mockReset();
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id3', key: 'Key3', values: ['x'] });
			await expect(service.updateAbacAttributeById('id3', { values: [] }, fakeActor)).rejects.toThrow('error-invalid-attribute-values');
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
			expect(mockAbacFindOneAndUpdate).not.toHaveBeenCalled();
		});

		it('throws error-attribute-in-use when key changes and old definition is in use', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacUpdateOne.mockReset();
			mockAbacFindOne
				.mockResolvedValueOnce({ _id: 'id4', key: 'Old', values: ['v1', 'v2'] }) // findOneById
				.mockResolvedValueOnce(null); // duplicate key check
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true);
			await expect(service.updateAbacAttributeById('id4', { key: 'New' }, fakeActor)).rejects.toThrow('error-attribute-in-use');
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Old', ['v1', 'v2']);
			expect(mockAbacFindOneAndUpdate).not.toHaveBeenCalled();
		});

		it('updates key when changed and not in use', async () => {
			mockAbacFindOne
				.mockResolvedValueOnce({ _id: 'id5', key: 'Old', values: ['a'] }) // findOneById
				.mockResolvedValueOnce(null); // duplicate key check
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			await service.updateAbacAttributeById('id5', { key: 'NewKey' }, fakeActor);
			expect(mockAbacUpdateOne).toHaveBeenCalledWith({ _id: 'id5' }, { $set: { key: 'NewKey' } });
		});

		it('throws error-attribute-in-use when removing a value that is in use', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacUpdateOne.mockReset();
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id6', key: 'Attr', values: ['a', 'b', 'c'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true); // removed value in use
			await expect(service.updateAbacAttributeById('id6', { values: ['a', 'c'] }, fakeActor)).rejects.toThrow('error-attribute-in-use');
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Attr', ['b']);
			expect(mockAbacFindOneAndUpdate).not.toHaveBeenCalled();
		});

		it('updates values when removing some that are not in use', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id7', key: 'Attr', values: ['a', 'b', 'c'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false); // removal safe
			mockAbacUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			await service.updateAbacAttributeById('id7', { values: ['a', 'c'] }, fakeActor);
			expect(mockAbacUpdateOne).toHaveBeenCalledWith({ _id: 'id7' }, { $set: { values: ['a', 'c'] } });
		});

		it('updates values when only adding (no removal) without in-use check', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id8', key: 'Attr', values: ['a'] });
			mockAbacUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			await service.updateAbacAttributeById('id8', { values: ['a', 'b'] }, fakeActor);
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
			expect(mockAbacUpdateOne).toHaveBeenCalledWith({ _id: 'id8' }, { $set: { values: ['a', 'b'] } });
		});

		it('throws error-duplicate-attribute-key on duplicate key error', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacUpdateOne.mockReset();
			mockAbacFindOne
				.mockResolvedValueOnce({ _id: 'id9', key: 'Old', values: ['v'] }) // findOneById
				.mockResolvedValueOnce(null); // duplicate key check
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockRejectedValueOnce(new Error('E11000 duplicate key error collection'));
			await expect(service.updateAbacAttributeById('id9', { key: 'NewKey' }, fakeActor)).rejects.toThrow('error-duplicate-attribute-key');
		});

		it('propagates unexpected update errors', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacUpdateOne.mockReset();
			mockAbacFindOne
				.mockResolvedValueOnce({ _id: 'id10', key: 'Old', values: ['v'] }) // findOneById
				.mockResolvedValueOnce(null); // duplicate key check
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockRejectedValueOnce(new Error('write-failed'));
			await expect(service.updateAbacAttributeById('id10', { key: 'Another' }, fakeActor)).rejects.toThrow('write-failed');
		});
	});
	describe('deleteAbacAttributeById', () => {
		beforeEach(() => {
			mockAbacFindOne.mockReset();
			mockAbacDeleteOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
		});

		it('throws error-attribute-not-found when attribute does not exist', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacDeleteOne.mockReset();
			mockAbacFindOne.mockResolvedValueOnce(null);
			await expect(service.deleteAbacAttributeById('missing', fakeActor)).rejects.toThrow('error-attribute-not-found');
		});

		it('throws error-attribute-in-use when attribute is referenced by a room', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacDeleteOne.mockReset();
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id11', key: 'KeyInUse', values: ['a', 'b'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true);
			await expect(service.deleteAbacAttributeById('id11', fakeActor)).rejects.toThrow('error-attribute-in-use');
			expect(mockAbacDeleteOne).not.toHaveBeenCalled();
		});

		it('deletes attribute when not in use', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacDeleteOne.mockReset();
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id12', key: 'FreeKey', values: ['x'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacDeleteOne.mockResolvedValueOnce({ deletedCount: 1 });
			await service.deleteAbacAttributeById('id12', fakeActor);
			expect(mockAbacDeleteOne).toHaveBeenCalledWith('id12');
		});
	});
	describe('getAbacAttributeById', () => {
		beforeEach(() => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
		});
		it('throws error-attribute-not-found when attribute does not exist', async () => {
			mockAbacFindOne.mockResolvedValueOnce(null);
			await expect(service.getAbacAttributeById('missingAttr', undefined)).rejects.toThrow('error-attribute-not-found');
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
		});

		it('returns attribute without usage map', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id13', key: 'Attr', values: ['a', 'b', 'c'] });

			const result = await service.getAbacAttributeById('id13', undefined);
			expect(mockAbacFindOne).toHaveBeenCalledWith('id13', { projection: { key: 1, values: 1 } });
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();

			expect(result).toEqual({
				key: 'Attr',
				values: ['a', 'b', 'c'],
			});
		});
	});

	describe('setRoomAbacAttributes', () => {
		// Using top-level mocks (mockSetAbacAttributesById, mockAbacFind) defined in jest.mock factory above

		beforeEach(() => {
			mockSetAbacAttributesById.mockReset();
			mockAbacFind.mockReset();
			mockFindOneByIdAndType.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			// Provide a default empty cursor so AbacAttributes.find always returns an object with toArray
			mockAbacFind.mockReturnValue({ toArray: async () => [] });
			// Prevent the protected hook from throwing
			(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
		});

		it('throws error-room-not-found when room does not exist', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce(null);
			await expect(service.setRoomAbacAttributes('missing', { dept: ['eng'] }, fakeActor)).rejects.toThrow('error-room-not-found');
			expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
		});

		it('accepts a default room', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], default: true });
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });

			await service.setRoomAbacAttributes('r1', { dept: ['eng'] }, fakeActor);

			expect(mockSetAbacAttributesById).toHaveBeenCalled();
		});

		describe('room-scoped edits and required attributes', () => {
			const room = {
				_id: 'r1',
				abacAttributes: [
					{ key: 'dept', values: ['eng'] },
					{ key: 'region', values: ['emea'] },
				],
			};

			let enforcing: boolean;

			beforeEach(() => {
				enforcing = false;
				mockHasPermission.mockReset().mockResolvedValue(false);
				mockSettingsGet.mockImplementation(async (id: string) => {
					if (id === 'ABAC_Required_Attributes') {
						return ['dept', 'clearance'];
					}
					return id === 'ABAC_Enforce_All_Rooms' ? enforcing : undefined;
				});
				const definitions = [
					{ key: 'dept', values: ['eng', 'sales'] },
					{ key: 'region', values: ['emea', 'apac'] },
					{ key: 'clearance', values: ['secret'] },
				];
				mockAbacFind.mockImplementation(({ key }: { key: { $in: string[] } }) => ({
					toArray: async () => definitions.filter((definition) => key.$in.includes(definition.key)),
				}));
				mockFindOneByIdAndType.mockResolvedValue(room);
			});

			afterEach(() => {
				mockSettingsGet.mockReset();
				mockHasPermission.mockReset();
			});

			const writeAs = (attributes: Record<string, string[]>, grant: AbacRoomAttributesGrant = 'edit-room-abac-attributes') =>
				service.setRoomAbacAttributes('r1', attributes, fakeActor, grant);

			it('refuses a room-scoped editor removing every attribute while enforcement is on', async () => {
				enforcing = true;

				await expect(writeAs({})).rejects.toMatchObject({ code: 'error-abac-room-attributes-cleared' });
				expect(mockUnsetAbacAttributesById).not.toHaveBeenCalled();
			});

			it('lets a room-scoped editor remove every attribute, required ones included, while enforcement is off', async () => {
				await writeAs({});

				expect(mockUnsetAbacAttributesById).toHaveBeenCalledWith('r1');
			});

			it('refuses a room-scoped editor removing a required attribute the room carries', async () => {
				await expect(writeAs({ region: ['emea'] })).rejects.toMatchObject({
					code: 'error-abac-required-attributes-removed',
					details: { keys: ['dept'] },
				});
				expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
			});

			it('lets a room-scoped editor change the values of a required attribute and remove one that is not required', async () => {
				await writeAs({ dept: ['sales'] });

				expect(mockSetAbacAttributesById).toHaveBeenCalledWith('r1', [{ key: 'dept', values: ['sales'] }]);
			});

			it('lets a room-scoped editor add a required attribute the room lacks, one at a time', async () => {
				await writeAs({ dept: ['eng'], region: ['emea'], clearance: ['secret'] });

				expect(mockSetAbacAttributesById).toHaveBeenCalled();
			});

			it('leaves an editor holding the ABAC admin permissions unrestricted', async () => {
				enforcing = true;

				await writeAs({ region: ['emea'] }, 'manage-abac-admin-rooms');
				await writeAs({}, 'manage-abac-admin-rooms');

				expect(mockSetAbacAttributesById).toHaveBeenCalledWith('r1', [{ key: 'region', values: ['emea'] }]);
				expect(mockUnsetAbacAttributesById).toHaveBeenCalledWith('r1');
			});

			it('refuses the same in the preview', async () => {
				enforcing = true;
				(service as any).pdp = {
					isAvailable: jest.fn().mockResolvedValue(true),
					needsEvaluation: jest.fn(),
					previewRoomMembers: jest.fn(),
				};

				await expect(
					service.previewRoomMembers('r1', { region: ['emea'] }, fakeActor, { count: 10 }, 'edit-room-abac-attributes'),
				).rejects.toMatchObject({ code: 'error-abac-required-attributes-removed' });
				await expect(service.previewRoomMembers('r1', {}, fakeActor, { count: 10 }, 'edit-room-abac-attributes')).rejects.toMatchObject({
					code: 'error-abac-room-attributes-cleared',
				});
			});
		});

		describe('while restricting to owned attributes is on', () => {
			beforeEach(() => {
				mockHasPermission.mockReset().mockResolvedValue(false);
				mockSettingsGet.mockImplementation(async (id: string) => id === 'ABAC_Restrict_To_Owned_Attributes');
				mockAbacFind.mockReturnValue({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales', 'ops'] }] });
				mockFindOneByIdAndType.mockResolvedValue({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['ops'] }] });
				(service as any).attributeStores.local.store.entitlementsOf = jest.fn().mockResolvedValue(new Map([['dept', new Set(['eng'])]]));
			});

			afterEach(() => {
				mockSettingsGet.mockReset();
				mockHasPermission.mockReset();
			});

			it('refuses a room-scoped editor a value they do not hold', async () => {
				const write = service.setRoomAbacAttributes('r1', { dept: ['eng', 'sales'] }, fakeActor, 'edit-room-abac-attributes');

				await expect(write).rejects.toMatchObject({
					code: 'error-invalid-attribute-values',
					details: { attributes: [{ key: 'dept', values: ['sales'] }] },
				});
				expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
			});

			it('lets a room-scoped editor keep a value the room already carries', async () => {
				await service.setRoomAbacAttributes('r1', { dept: ['eng', 'ops'] }, fakeActor, 'edit-room-abac-attributes');

				expect(mockSetAbacAttributesById).toHaveBeenCalledWith('r1', [{ key: 'dept', values: ['eng', 'ops'] }]);
			});

			it('does not restrict an editor holding the ABAC admin permissions', async () => {
				await service.setRoomAbacAttributes('r1', { dept: ['sales'] }, fakeActor, 'manage-abac-admin-rooms');

				expect(mockSetAbacAttributesById).toHaveBeenCalledWith('r1', [{ key: 'dept', values: ['sales'] }]);
			});

			it('does not restrict a room-scoped editor holding bypass-abac-store-validation', async () => {
				mockHasPermission.mockResolvedValue(true);

				await service.setRoomAbacAttributes('r1', { dept: ['sales'] }, fakeActor, 'edit-room-abac-attributes');

				expect(mockSetAbacAttributesById).toHaveBeenCalled();
			});

			it('does not restrict a room-scoped editor under the Virtru PDP', async () => {
				(service as any).pdpType = 'virtru';

				await service.setRoomAbacAttributes('r1', { dept: ['sales'] }, fakeActor, 'edit-room-abac-attributes');

				expect(mockSetAbacAttributesById).toHaveBeenCalled();
			});
		});

		it('accepts a team default room', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], teamDefault: true });
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });

			await service.setRoomAbacAttributes('r1', { dept: ['eng'] }, fakeActor);

			expect(mockSetAbacAttributesById).toHaveBeenCalled();
		});

		it('throws error-invalid-attribute-key for invalid key format', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
			await expect(service.setRoomAbacAttributes('r1', { 'bad key': ['v'] } as any, fakeActor)).rejects.toThrow(
				'error-invalid-attribute-key',
			);
			expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
		});

		it('throws error-invalid-attribute-values for empty value array', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
			await expect(service.setRoomAbacAttributes('r1', { dept: [] as any }, fakeActor)).rejects.toThrow('error-invalid-attribute-values');
			expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
		});

		it('throws error-attribute-definition-not-found when definition for key missing', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
			// Return empty list so size mismatch triggers not-found
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [] });
			await expect(service.setRoomAbacAttributes('r1', { dept: ['eng'] }, fakeActor)).rejects.toThrow(
				'error-attribute-definition-not-found',
			);
			expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
		});

		it('throws error-invalid-attribute-values when a provided value not in definition', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
			mockAbacFind.mockReturnValueOnce({
				toArray: async () => [{ key: 'dept', values: ['eng'] }], // 'sales' not allowed
			});
			await expect(service.setRoomAbacAttributes('r1', { dept: ['eng', 'sales'] }, fakeActor)).rejects.toThrow(
				'error-invalid-attribute-values',
			);
			expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
		});

		it('does not call onroomattributechanged when the change is a duplicated attribute value', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
			mockAbacFind.mockReturnValueOnce({
				toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }],
			});

			await service.setRoomAbacAttributes('r1', { dept: ['eng', 'eng', 'sales'] }, fakeActor);

			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});

		it('does not call onRoomAttributesChanged when an existing value is removed', async () => {
			const existing = [{ key: 'dept', values: ['eng', 'sales'] }];
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			mockAbacFind.mockReturnValueOnce({
				toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }],
			});

			await service.setRoomAbacAttributes('r1', { dept: ['eng'] }, fakeActor); // removing 'sales'

			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
			expect(mockSetAbacAttributesById).toHaveBeenCalledWith('r1', [{ key: 'dept', values: ['eng'] }]);
		});

		it('calls onRoomAttributesChanged when a value is removed and the PDP evaluates removals', async () => {
			evaluateRemovalsToo();
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
			mockAbacFind.mockReturnValueOnce({
				toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }],
			});

			await service.setRoomAbacAttributes('r1', { dept: ['eng'] }, fakeActor);

			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(
				expect.objectContaining({ _id: 'r1' }),
				[{ key: 'dept', values: ['eng'] }],
				fakeActor,
			);
		});

		it('calls onRoomAttributesChanged when adding values to an existing attribute', async () => {
			const existing = [{ key: 'dept', values: ['eng'] }];
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			mockAbacFind.mockReturnValueOnce({
				toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }],
			});

			await service.setRoomAbacAttributes('r1', { dept: ['eng', 'sales'] }, fakeActor); // adding sales

			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(
				expect.objectContaining({ _id: 'r1' }),
				[{ key: 'dept', values: ['eng', 'sales'] }],
				fakeActor,
			);
			expect(mockSetAbacAttributesById).toHaveBeenCalledWith('r1', [{ key: 'dept', values: ['eng', 'sales'] }]);
		});

		it('clears all attributes via unset (not setAbacAttributesById) when given an empty map for a room that had attributes', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng'] }] });

			await service.setRoomAbacAttributes('r1', {}, fakeActor);

			expect(mockUnsetAbacAttributesById).toHaveBeenCalledWith('r1');
			expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});
	});

	describe('isAbacAttributeInUseByKey', () => {
		beforeEach(() => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
		});
		it('returns false when attribute does not exist', async () => {
			mockAbacFindOne.mockResolvedValueOnce(null);
			const result = await service.isAbacAttributeInUseByKey('missing');
			expect(result).toBe(false);
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
		});

		it('returns false when attribute exists but has no values', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id14', key: 'Empty', values: [] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			const result = await service.isAbacAttributeInUseByKey('Empty');
			expect(result).toBe(false);
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Empty', []);
		});

		it('returns true when any value is in use', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id15', key: 'Attr2', values: ['x', 'y'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true);
			const result = await service.isAbacAttributeInUseByKey('Attr2');
			expect(result).toBe(true);
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Attr2', ['x', 'y']);
		});

		it('returns false when no values are in use', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id16', key: 'Attr3', values: ['m', 'n'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			const result = await service.isAbacAttributeInUseByKey('Attr3');
			expect(result).toBe(false);
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Attr3', ['m', 'n']);
		});
	});

	describe('updateRoomAbacAttributeValues', () => {
		beforeEach(() => {
			mockFindOneByIdAndType.mockReset();
			mockUpdateSingleAbacAttributeValuesById.mockReset();
			mockUpdateAbacAttributeValuesArrayFilteredById.mockReset();
			mockAbacFind.mockReset();
			(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
			// default definition cursor
			mockAbacFind.mockReturnValue({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] });
		});

		it('throws error-room-not-found if room missing', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce(null);
			await expect(service.updateRoomAbacAttributeValues('missing', 'dept', ['eng'], fakeActor)).rejects.toThrow('error-room-not-found');
		});

		it('throws error-invalid-attribute-values if adding new key exceeds max attributes', async () => {
			const existing = Array.from({ length: 10 }, (_, i) => ({ key: `k${i}`, values: ['x'] }));
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			await expect(service.updateRoomAbacAttributeValues('r1', 'newKey', ['val'], fakeActor)).rejects.toThrow(
				'error-invalid-attribute-values',
			);
		});

		it('adds new key using updateSingleAbacAttributeValuesById when within limit', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'other', values: ['x'] }] });
			await service.updateRoomAbacAttributeValues('r1', 'dept', ['eng'], fakeActor);
			expect(mockUpdateSingleAbacAttributeValuesById).toHaveBeenCalledWith('r1', 'dept', ['eng']);
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).not.toHaveBeenCalled();
		});

		it('does nothing when values array is identical (no update, no hook)', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
			await service.updateRoomAbacAttributeValues('r1', 'dept', ['eng', 'sales'], fakeActor);
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).not.toHaveBeenCalled();
			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});

		it('updates existing key (addition only) and triggers hook when a value is added', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng'] }] });
			await service.updateRoomAbacAttributeValues('r1', 'dept', ['eng', 'sales'], fakeActor);
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).toHaveBeenCalledWith('r1', 'dept', ['eng', 'sales']);
			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(
				expect.objectContaining({ _id: 'r1' }),
				[{ key: 'dept', values: ['eng', 'sales'] }],
				fakeActor,
			);
		});

		it('updates existing key and does NOT trigger hook when a value is removed', async () => {
			// Existing attribute loses one value; hook should NOT fire per new behavior
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
			await service.updateRoomAbacAttributeValues('r1', 'dept', ['eng'], fakeActor);
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).toHaveBeenCalledWith('r1', 'dept', ['eng']);
			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});

		it('triggers the hook when a value is removed and the PDP evaluates removals', async () => {
			evaluateRemovalsToo();
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });

			await service.updateRoomAbacAttributeValues('r1', 'dept', ['eng'], fakeActor);

			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(
				expect.objectContaining({ _id: 'r1' }),
				[{ key: 'dept', values: ['eng'] }],
				fakeActor,
			);
		});

		it('validates against global definitions (invalid value)', async () => {
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
			await expect(service.updateRoomAbacAttributeValues('r1', 'dept', ['eng', 'sales'], fakeActor)).rejects.toThrow(
				'error-invalid-attribute-values',
			);
		});
	});

	describe('removeRoomAbacAttribute', () => {
		beforeEach(() => {
			mockFindOneByIdAndType.mockReset();
			mockRemoveAbacAttributeByRoomIdAndKey.mockReset();
			(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
		});

		it('throws error-room-not-found when room does not exist', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce(null);
			await expect((service as any).removeRoomAbacAttribute('missing', 'dept', fakeActor)).rejects.toThrow('error-room-not-found');
			expect(mockRemoveAbacAttributeByRoomIdAndKey).not.toHaveBeenCalled();
		});

		it('returns early (no update, no hook) when attribute key not present', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'other', values: ['x'] }] });
			await (service as any).removeRoomAbacAttribute('r1', 'dept', fakeActor);
			expect(mockRemoveAbacAttributeByRoomIdAndKey).not.toHaveBeenCalled();
			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});

		it('removes attribute and does NOT call hook when key exists', async () => {
			// Removing an entire attribute should not trigger the hook anymore
			const existing = [
				{ key: 'dept', values: ['eng', 'sales'] },
				{ key: 'other', values: ['x'] },
			];
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			await (service as any).removeRoomAbacAttribute('r1', 'dept', fakeActor);
			expect(mockRemoveAbacAttributeByRoomIdAndKey).toHaveBeenCalledWith('r1', 'dept');
			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});

		it('calls the hook with the remaining attributes when the PDP evaluates removals', async () => {
			evaluateRemovalsToo();
			mockFindOneByIdAndType.mockResolvedValueOnce({
				_id: 'r1',
				abacAttributes: [
					{ key: 'dept', values: ['eng', 'sales'] },
					{ key: 'other', values: ['x'] },
				],
			});

			await (service as any).removeRoomAbacAttribute('r1', 'dept', fakeActor);

			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(
				expect.objectContaining({ _id: 'r1' }),
				[{ key: 'other', values: ['x'] }],
				fakeActor,
			);
		});

		it('unsets every attribute (not single-key removal) when removing the last remaining attribute', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', name: 'room-one', abacAttributes: [{ key: 'dept', values: ['eng'] }] });

			await (service as any).removeRoomAbacAttribute('r1', 'dept', fakeActor);

			expect(mockUnsetAbacAttributesById).toHaveBeenCalledWith('r1');
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'abac.object.attributes.removed',
				expect.objectContaining({ room: { _id: 'r1', name: 'room-one' } }),
				expect.anything(),
			);
			expect(mockRemoveAbacAttributeByRoomIdAndKey).not.toHaveBeenCalled();
			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});
	});

	describe('replaceRoomAbacAttributeByKey', () => {
		beforeEach(() => {
			mockFindOneByIdAndType.mockReset();
			mockUpdateAbacAttributeValuesArrayFilteredById.mockReset();
			mockInsertAbacAttributeIfNotExistsById.mockReset();
			mockAbacFind.mockReset();
			(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
			// default attribute definitions
			mockAbacFind.mockReturnValue({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] });
		});

		it('throws error-invalid-attribute-values when more than 10 values provided', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
			const values = Array.from({ length: 11 }, (_, i) => `v${i}`);
			await expect((service as any).replaceRoomAbacAttributeByKey('r1', 'dept', values, fakeActor)).rejects.toThrow(
				'error-invalid-attribute-values',
			);
		});

		it('throws error-room-not-found if room missing', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce(null);
			await expect((service as any).replaceRoomAbacAttributeByKey('missing', 'dept', ['eng'], fakeActor)).rejects.toThrow(
				'error-room-not-found',
			);
		});

		it('throws error-invalid-attribute-values if adding new key exceeds max attributes', async () => {
			const existing = Array.from({ length: 10 }, (_, i) => ({ key: `k${i}`, values: ['x'] }));
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			await expect((service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor)).rejects.toThrow(
				'error-invalid-attribute-values',
			);
			expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
		});

		it('adds new key when under limit (calls insert and hook)', async () => {
			const existing = [{ key: 'other', values: ['x'] }];
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			const updatedDoc = { abacAttributes: [...existing, { key: 'dept', values: ['eng'] }] };
			mockInsertAbacAttributeIfNotExistsById.mockResolvedValueOnce(updatedDoc);

			await (service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor);

			expect(mockInsertAbacAttributeIfNotExistsById).toHaveBeenCalledWith('r1', 'dept', ['eng']);
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).not.toHaveBeenCalled();
			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(
				expect.objectContaining({ _id: 'r1' }),
				updatedDoc.abacAttributes,
				fakeActor,
			);
		});

		it('replaces existing key (calls update and hook)', async () => {
			const existing = [{ key: 'dept', values: ['eng'] }];
			const updatedDoc = { abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] };
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			mockUpdateAbacAttributeValuesArrayFilteredById.mockResolvedValueOnce(updatedDoc);

			await (service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng', 'sales'], fakeActor);

			expect(mockUpdateAbacAttributeValuesArrayFilteredById).toHaveBeenCalledWith('r1', 'dept', ['eng', 'sales']);
			expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(
				expect.objectContaining({ _id: 'r1' }),
				updatedDoc.abacAttributes,
				fakeActor,
			);
		});

		it('does not call the hook when a value is removed under the local PDP', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
			mockUpdateAbacAttributeValuesArrayFilteredById.mockResolvedValueOnce({ abacAttributes: [{ key: 'dept', values: ['eng'] }] });

			await (service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor);

			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});

		it('calls the hook when a value is removed and the PDP evaluates removals', async () => {
			evaluateRemovalsToo();
			const updatedDoc = { abacAttributes: [{ key: 'dept', values: ['eng'] }] };
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
			mockUpdateAbacAttributeValuesArrayFilteredById.mockResolvedValueOnce(updatedDoc);

			await (service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor);

			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(
				expect.objectContaining({ _id: 'r1' }),
				updatedDoc.abacAttributes,
				fakeActor,
			);
		});

		it('validates definitions and rejects invalid value', async () => {
			// Only 'eng' allowed for dept
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });

			await expect((service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng', 'sales'], fakeActor)).rejects.toThrow(
				'error-invalid-attribute-values',
			);
			expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).not.toHaveBeenCalled();
		});
	});

	describe('addRoomAbacAttributeByKey', () => {
		beforeEach(() => {
			mockFindOneByIdAndType.mockReset();
			mockInsertAbacAttributeIfNotExistsById.mockReset();
			mockAbacFind.mockReset();
			(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
		});

		it('throws error-room-not-found when room does not exist', async () => {
			// Ensure definitions exist to pass definition check, but room missing
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce(null);
			await expect(service.addRoomAbacAttributeByKey('missing', 'dept', ['eng'], fakeActor)).rejects.toThrow('error-room-not-found');
			expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
		});

		it('throws error-attribute-definition-not-found when attribute definition missing', async () => {
			// No definitions returned
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
			await expect(service.addRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor)).rejects.toThrow(
				'error-attribute-definition-not-found',
			);
			expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
		});

		it('throws error-duplicate-attribute-key when key already exists in room', async () => {
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({
				_id: 'r1',
				abacAttributes: [{ key: 'dept', values: ['eng'] }],
			});
			await expect(service.addRoomAbacAttributeByKey('r1', 'dept', ['sales'], fakeActor)).rejects.toThrow('error-duplicate-attribute-key');
			expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
		});

		it('throws error-invalid-attribute-values when room already has 10 attributes', async () => {
			const existing = Array.from({ length: 10 }, (_, i) => ({ key: `k${i}`, values: ['x'] }));
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			await expect(service.addRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor)).rejects.toThrow('error-invalid-attribute-values');
			expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
		});

		it('inserts new attribute and calls hook with DB returned document', async () => {
			const existing = [{ key: 'other', values: ['x'] }];
			const updatedDoc = { abacAttributes: [...existing, { key: 'dept', values: ['eng', 'sales'] }] };
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			mockInsertAbacAttributeIfNotExistsById.mockResolvedValueOnce(updatedDoc);

			await service.addRoomAbacAttributeByKey('r1', 'dept', ['eng', 'sales'], fakeActor);

			expect(mockInsertAbacAttributeIfNotExistsById).toHaveBeenCalledWith('r1', 'dept', ['eng', 'sales']);
			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(
				expect.objectContaining({ _id: 'r1' }),
				updatedDoc.abacAttributes,
				fakeActor,
			);
		});

		it('inserts new attribute and calls hook with constructed list when DB returns undefined', async () => {
			const existing = [{ key: 'other', values: ['x'] }];
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			mockInsertAbacAttributeIfNotExistsById.mockResolvedValueOnce(undefined);

			await service.addRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor);

			expect(mockInsertAbacAttributeIfNotExistsById).toHaveBeenCalledWith('r1', 'dept', ['eng']);
			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(
				expect.objectContaining({ _id: 'r1' }),
				[...existing, { key: 'dept', values: ['eng'] }],
				fakeActor,
			);
		});

		it('rejects when provided value not allowed by definition', async () => {
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
			await expect(service.addRoomAbacAttributeByKey('r1', 'dept', ['eng', 'sales'], fakeActor)).rejects.toThrow(
				'error-invalid-attribute-values',
			);
			expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
		});
	});

	describe('attribute-store write guard (assertCanModifyRoom + validateAssignable)', () => {
		const room = { _id: 'r1', name: 'room', abacAttributes: [{ key: 'dept', values: ['eng'] }] };

		const makeStore = () => ({
			assertCanModifyRoom: jest.fn().mockResolvedValue(undefined),
			validateAssignable: jest.fn().mockResolvedValue(undefined),
		});

		const noMutation = () => {
			expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
			expect(mockUnsetAbacAttributesById).not.toHaveBeenCalled();
			expect(mockUpdateSingleAbacAttributeValuesById).not.toHaveBeenCalled();
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).not.toHaveBeenCalled();
			expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
			expect(mockCreateAuditServerEvent).not.toHaveBeenCalled();
		};

		beforeEach(() => {
			mockFindOneByIdAndType.mockReset().mockResolvedValue(room);
			mockSetAbacAttributesById.mockReset();
			mockUnsetAbacAttributesById.mockReset();
			mockUpdateSingleAbacAttributeValuesById.mockReset();
			mockUpdateAbacAttributeValuesArrayFilteredById
				.mockReset()
				.mockResolvedValue({ abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
			mockInsertAbacAttributeIfNotExistsById.mockReset().mockResolvedValue({
				abacAttributes: [
					{ key: 'dept', values: ['eng'] },
					{ key: 'k2', values: ['v'] },
				],
			});
			mockCreateAuditServerEvent.mockReset();
			mockAbacFind.mockReturnValue({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }] });
			(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
			(service as any).attributeStores.local.store = makeStore();
		});

		const invoke = (method: string): Promise<unknown> => {
			switch (method) {
				case 'setRoomAbacAttributes':
					return service.setRoomAbacAttributes('r1', { dept: ['eng', 'sales'] }, fakeActor);
				case 'updateRoomAbacAttributeValues':
					return service.updateRoomAbacAttributeValues('r1', 'dept', ['eng', 'sales'], fakeActor);
				case 'addRoomAbacAttributeByKey':
					return service.addRoomAbacAttributeByKey('r1', 'k2', ['v'], fakeActor);
				default:
					return service.replaceRoomAbacAttributeByKey('r1', 'dept', ['eng', 'sales'], fakeActor);
			}
		};

		describe.each([
			['setRoomAbacAttributes'],
			['updateRoomAbacAttributeValues'],
			['addRoomAbacAttributeByKey'],
			['replaceRoomAbacAttributeByKey'],
		])('%s', (method) => {
			it("invokes assertCanModifyRoom with the room's current attributes and propagates a rejection without mutating", async () => {
				const store = makeStore();
				store.assertCanModifyRoom.mockRejectedValueOnce(new Error('error-pdp-unavailable'));
				(service as any).attributeStores.local.store = store;

				await expect(invoke(method)).rejects.toThrow('error-pdp-unavailable');

				expect(store.assertCanModifyRoom).toHaveBeenCalledWith(
					expect.objectContaining({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng'] }] }),
					fakeActor,
				);
				expect(store.validateAssignable).not.toHaveBeenCalled();
				noMutation();
			});

			it('propagates a validateAssignable rejection without mutating', async () => {
				const store = makeStore();
				store.validateAssignable.mockRejectedValueOnce(new Error('error-invalid-attribute-values'));
				(service as any).attributeStores.local.store = store;

				await expect(invoke(method)).rejects.toThrow('error-invalid-attribute-values');

				expect(store.assertCanModifyRoom).toHaveBeenCalledTimes(1);
				noMutation();
			});

			it('skips assertCanModifyRoom and validateAssignable when the actor has the bypass permission', async () => {
				const store = makeStore();
				store.assertCanModifyRoom.mockRejectedValue(new Error('should-not-be-called'));
				store.validateAssignable.mockRejectedValue(new Error('should-not-be-called'));
				(service as any).attributeStores.local.store = store;
				mockHasPermission.mockResolvedValue(true);

				await expect(invoke(method)).resolves.toBeUndefined();

				expect(mockHasPermission).toHaveBeenCalledWith(fakeActor._id, 'bypass-abac-store-validation');
				expect(store.assertCanModifyRoom).not.toHaveBeenCalled();
				expect(store.validateAssignable).not.toHaveBeenCalled();
			});

			it('enforces both store guards when the actor lacks the bypass permission', async () => {
				const store = makeStore();
				(service as any).attributeStores.local.store = store;
				mockHasPermission.mockResolvedValue(false);

				await expect(invoke(method)).resolves.toBeUndefined();

				expect(store.assertCanModifyRoom).toHaveBeenCalledTimes(1);
				expect(store.validateAssignable).toHaveBeenCalledTimes(1);
			});
		});

		it('skips assertCanModifyRoom on the empty-clear path of setRoomAbacAttributes and still unsets', async () => {
			const store = makeStore();
			store.assertCanModifyRoom.mockRejectedValueOnce(new Error('error-pdp-unavailable'));
			(service as any).attributeStores.local.store = store;

			await expect(service.setRoomAbacAttributes('r1', {}, fakeActor)).resolves.toBeUndefined();

			expect(store.assertCanModifyRoom).not.toHaveBeenCalled();
			expect(store.validateAssignable).not.toHaveBeenCalled();
			expect(mockUnsetAbacAttributesById).toHaveBeenCalledWith('r1');
		});
	});

	describe('validateCreationAttributes', () => {
		const requested = [{ key: 'dept', values: ['eng', 'sales'] }];
		const creatorExcluded = { creatorJoins: false };
		const creatorJoining = { creatorJoins: true };

		const makeStore = (held: Record<string, string[]> = {}) => ({
			validateAssignable: jest.fn().mockResolvedValue(undefined),
			entitlementsOf: jest.fn().mockResolvedValue(new Map(Object.entries(held).map(([key, values]) => [key, new Set(values)]))),
		});

		const restrictToOwned = (enabled: boolean) =>
			mockSettingsGet.mockImplementation(async (id: string) => (id === 'ABAC_Restrict_To_Owned_Attributes' ? enabled : undefined));

		beforeEach(() => {
			mockHasPermission.mockReset().mockResolvedValue(false);
			mockAbacFind.mockReturnValue({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }] });
			restrictToOwned(true);
		});

		describe('under the local PDP', () => {
			it('names every attribute and only the values the actor does not hold', async () => {
				mockAbacFind.mockReturnValue({
					toArray: async () => [
						{ key: 'dept', values: ['eng', 'sales'] },
						{ key: 'region', values: ['emea', 'apac'] },
					],
				});
				(service as any).attributeStores.local.store = makeStore({ dept: ['eng'], region: ['emea'] });

				await expect(
					service.validateCreationAttributes([...requested, { key: 'region', values: ['emea', 'apac'] }], fakeActor, creatorExcluded),
				).resolves.toEqual({
					allowed: false,
					reason: 'not-entitled',
					code: 'error-invalid-attribute-values',
					attributes: [
						{ key: 'dept', values: ['sales'] },
						{ key: 'region', values: ['apac'] },
					],
				});
			});

			it('allows values the actor holds, normalized', async () => {
				(service as any).attributeStores.local.store = makeStore({ dept: ['eng', 'sales'] });

				const unnormalized = [{ key: ' dept ', values: ['eng', ' sales', 'eng'] }];

				await expect(service.validateCreationAttributes(unnormalized, fakeActor, creatorExcluded)).resolves.toEqual({
					allowed: true,
					attributes: requested,
					bypassed: false,
				});
			});

			it('allows values the actor does not hold when restricting to owned attributes is off', async () => {
				restrictToOwned(false);
				const store = makeStore();
				(service as any).attributeStores.local.store = store;

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toMatchObject({ allowed: true });
				expect(store.entitlementsOf).not.toHaveBeenCalled();
			});

			it('skips the owned-attributes rule for a bypass holder, and says so', async () => {
				mockHasPermission.mockResolvedValue(true);
				const store = makeStore();
				(service as any).attributeStores.local.store = store;

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toEqual({
					allowed: true,
					attributes: requested,
					bypassed: true,
				});
				expect(store.entitlementsOf).not.toHaveBeenCalled();
			});

			it('still refuses an attribute the workspace does not define to a bypass holder', async () => {
				mockHasPermission.mockResolvedValue(true);
				(service as any).attributeStores.local.store = makeStore();

				await expect(
					service.validateCreationAttributes([{ key: 'unknown', values: ['x'] }], fakeActor, creatorExcluded),
				).resolves.toMatchObject({
					allowed: false,
					reason: 'invalid',
					code: 'error-attribute-definition-not-found',
				});
			});

			it('refuses the same key given twice', async () => {
				(service as any).attributeStores.local.store = makeStore({ dept: ['eng', 'sales'] });

				await expect(
					service.validateCreationAttributes(
						[
							{ key: 'dept', values: ['eng'] },
							{ key: 'dept', values: ['sales'] },
						],
						fakeActor,
						creatorExcluded,
					),
				).resolves.toMatchObject({ allowed: false, reason: 'invalid', key: 'dept' });
			});

			it('refuses nothing to assign rather than approving it', async () => {
				(service as any).attributeStores.local.store = makeStore();

				await expect(service.validateCreationAttributes([], fakeActor, creatorExcluded)).resolves.toMatchObject({
					allowed: false,
					reason: 'invalid',
				});
			});

			it('refuses as unavailable when the PDP is down, before evaluating anything', async () => {
				(service as any).pdp = { isAvailable: jest.fn().mockResolvedValue(false) };
				const store = makeStore({ dept: ['eng', 'sales'] });
				(service as any).attributeStores.local.store = store;

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toEqual({
					allowed: false,
					reason: 'unavailable',
					code: 'error-pdp-unavailable',
				});
				expect(store.entitlementsOf).not.toHaveBeenCalled();
			});
		});

		describe('under the Virtru PDP', () => {
			beforeEach(() => {
				mockHasModule.mockReturnValue(true);
				Object.assign(service as any, {
					abacEnabled: true,
					pdpTypeSetting: 'virtru',
					attributeStoreSetting: 'virtru',
					pdpType: 'virtru',
					pdp: { isAvailable: jest.fn().mockResolvedValue(true) },
				});
			});

			it('names the attribute Virtru does not entitle the actor to, and ignores the owned-attributes rule', async () => {
				const store = makeStore();
				store.validateAssignable.mockRejectedValue(
					new AbacInvalidAttributeValuesError({ attributes: [{ key: 'dept', values: ['sales'] }] }),
				);
				(service as any).attributeStores.virtru.store = store;

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toEqual({
					allowed: false,
					reason: 'not-entitled',
					code: 'error-invalid-attribute-values',
					attributes: [{ key: 'dept', values: ['sales'] }],
				});
				expect(store.entitlementsOf).not.toHaveBeenCalled();
			});

			it('allows exactly what Virtru entitles the actor to', async () => {
				const store = makeStore();
				(service as any).attributeStores.virtru.store = store;

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toEqual({
					allowed: true,
					attributes: requested,
					bypassed: false,
				});
				expect(store.validateAssignable).toHaveBeenCalledWith(requested, fakeActor);
			});

			it('refuses as inconclusive when the actor cannot be resolved to a Virtru entity', async () => {
				const store = makeStore();
				store.validateAssignable.mockRejectedValue(new AbacEntityResolutionFailedError());
				(service as any).attributeStores.virtru.store = store;

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toEqual({
					allowed: false,
					reason: 'inconclusive',
					code: 'error-virtru-entity-resolution-failed',
				});
			});

			it('refuses as unavailable, rather than failing, when the entitlements call errors or times out', async () => {
				const store = makeStore();
				store.validateAssignable.mockRejectedValue(new Error('request timed out'));
				(service as any).attributeStores.virtru.store = store;

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toEqual({
					allowed: false,
					reason: 'unavailable',
					code: 'error-pdp-unavailable',
				});
			});

			it('refuses as unavailable when Virtru cannot be reached', async () => {
				const store = makeStore();
				store.validateAssignable.mockRejectedValue(new PdpUnavailableError());
				(service as any).attributeStores.virtru.store = store;

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toMatchObject({
					allowed: false,
					reason: 'unavailable',
				});
			});

			it('skips the entitlement check for a bypass holder', async () => {
				mockHasPermission.mockResolvedValue(true);
				const store = makeStore();
				(service as any).attributeStores.virtru.store = store;

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toMatchObject({
					allowed: true,
					bypassed: true,
				});
				expect(store.validateAssignable).not.toHaveBeenCalled();
			});

			describe('with the local attribute store', () => {
				let checkUsernamesMatchAttributes: jest.Mock;

				beforeEach(() => {
					checkUsernamesMatchAttributes = jest.fn().mockResolvedValue(undefined);
					Object.assign(service as any, {
						attributeStoreSetting: 'local',
						pdp: { isAvailable: jest.fn().mockResolvedValue(true), checkUsernamesMatchAttributes },
					});
					(service as any).attributeStores.local.store = makeStore();
				});

				it('refuses the creation when Virtru does not permit the creator the attributes', async () => {
					checkUsernamesMatchAttributes.mockRejectedValue(new OnlyCompliantCanBeAddedToRoomError());

					await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toEqual({
						allowed: false,
						reason: 'not-entitled',
						code: 'error-only-compliant-users-can-be-added-to-abac-rooms',
					});
					expect(checkUsernamesMatchAttributes).toHaveBeenCalledWith([fakeActor.username], requested, { _id: 'room-creation' });
				});

				it('allows what Virtru permits the creator, without the owned-attributes rule', async () => {
					const store = makeStore();
					(service as any).attributeStores.local.store = store;

					await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toEqual({
						allowed: true,
						attributes: requested,
						bypassed: false,
					});
					expect(store.entitlementsOf).not.toHaveBeenCalled();
				});

				it('refuses a creator without a username rather than asking Virtru about nobody', async () => {
					await expect(
						service.validateCreationAttributes(requested, { ...fakeActor, username: undefined } as any, creatorExcluded),
					).resolves.toMatchObject({
						allowed: false,
						reason: 'not-entitled',
					});
					expect(checkUsernamesMatchAttributes).not.toHaveBeenCalled();
				});
			});
		});

		describe('when the creator joins the room', () => {
			let checkUsernamesMatchAttributes: jest.Mock;

			beforeEach(() => {
				checkUsernamesMatchAttributes = jest.fn().mockResolvedValue(undefined);
				(service as any).pdp = { isAvailable: jest.fn().mockResolvedValue(true), checkUsernamesMatchAttributes };
				(service as any).attributeStores.local.store = makeStore();
				restrictToOwned(false);
			});

			it('refuses a creator the PDP would not admit to the room', async () => {
				checkUsernamesMatchAttributes.mockRejectedValue(new OnlyCompliantCanBeAddedToRoomError());

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorJoining)).resolves.toEqual({
					allowed: false,
					reason: 'creator-not-admitted',
					code: 'error-only-compliant-users-can-be-added-to-abac-rooms',
				});
				expect(checkUsernamesMatchAttributes).toHaveBeenCalledWith([fakeActor.username], requested, { _id: 'room-creation' });
			});

			it('refuses a bypass holder the PDP would not admit to the room', async () => {
				mockHasPermission.mockResolvedValue(true);
				checkUsernamesMatchAttributes.mockRejectedValue(new OnlyCompliantCanBeAddedToRoomError());

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorJoining)).resolves.toMatchObject({
					allowed: false,
					reason: 'creator-not-admitted',
				});
			});

			it('refuses as unavailable when the admission check fails unexpectedly', async () => {
				checkUsernamesMatchAttributes.mockRejectedValue(new Error('request timed out'));

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorJoining)).resolves.toEqual({
					allowed: false,
					reason: 'unavailable',
					code: 'error-pdp-unavailable',
				});
			});

			it('allows a creator the PDP admits', async () => {
				await expect(service.validateCreationAttributes(requested, fakeActor, creatorJoining)).resolves.toEqual({
					allowed: true,
					attributes: requested,
					bypassed: false,
				});
			});

			it('does not ask about a creator who does not join', async () => {
				checkUsernamesMatchAttributes.mockRejectedValue(new OnlyCompliantCanBeAddedToRoomError());

				await expect(service.validateCreationAttributes(requested, fakeActor, creatorExcluded)).resolves.toMatchObject({ allowed: true });
				expect(checkUsernamesMatchAttributes).not.toHaveBeenCalled();
			});
		});
	});

	describe('listAssignableAttributes', () => {
		const definitions = [
			{ _id: 'a2', key: 'region', values: ['emea', 'apac'] },
			{ _id: 'a1', key: 'dept', values: ['eng', 'sales'] },
		];

		const holding = (held: Record<string, string[]>) => {
			const store = {
				entitlementsOf: jest.fn().mockResolvedValue(new Map(Object.entries(held).map(([key, values]) => [key, new Set(values)]))),
			};
			(service as any).attributeStores.local.store = store;
			return store;
		};

		const restrictToOwned = (enabled: boolean) =>
			mockSettingsGet.mockImplementation(async (id: string) => (id === 'ABAC_Restrict_To_Owned_Attributes' ? enabled : undefined));

		beforeEach(() => {
			mockHasPermission.mockReset().mockResolvedValue(false);
			mockAbacFind.mockReturnValue({ toArray: async () => definitions });
			restrictToOwned(true);
		});

		describe('under the local PDP', () => {
			it('offers only the defined values the actor holds, sorted by key', async () => {
				holding({ region: ['emea', 'unknown'], dept: ['eng'], clearance: ['secret'] });

				await expect(service.listAssignableAttributes(fakeActor)).resolves.toEqual([
					{ key: 'dept', values: ['eng'] },
					{ key: 'region', values: ['emea'] },
				]);
			});

			it('leaves out a key the actor holds no value of, so a required one can be named as missing', async () => {
				holding({ dept: ['eng'] });

				await expect(service.listAssignableAttributes(fakeActor)).resolves.toEqual([{ key: 'dept', values: ['eng'] }]);
			});

			it('offers every definition when restricting to owned attributes is off', async () => {
				restrictToOwned(false);
				const store = holding({});

				await expect(service.listAssignableAttributes(fakeActor)).resolves.toEqual([
					{ key: 'dept', values: ['eng', 'sales'] },
					{ key: 'region', values: ['emea', 'apac'] },
				]);
				expect(store.entitlementsOf).not.toHaveBeenCalled();
			});

			it('offers every definition to a bypass holder', async () => {
				mockHasPermission.mockResolvedValue(true);
				const store = holding({});

				await expect(service.listAssignableAttributes(fakeActor)).resolves.toHaveLength(2);
				expect(mockHasPermission).toHaveBeenCalledWith(fakeActor._id, 'bypass-abac-store-validation');
				expect(store.entitlementsOf).not.toHaveBeenCalled();
			});

			describe('for an existing room', () => {
				beforeEach(() => {
					mockFindOneByIdAndType.mockResolvedValue({ _id: 'r1', t: 'p', abacAttributes: [{ key: 'region', values: ['apac'] }] });
				});

				it('offers a room-scoped editor the values they hold and the values the room already carries', async () => {
					holding({ dept: ['eng'] });

					await expect(service.listRoomAssignableAttributes('r1', fakeActor, 'edit-room-abac-attributes')).resolves.toEqual([
						{ key: 'dept', values: ['eng'] },
						{ key: 'region', values: ['apac'] },
					]);
				});

				it('offers a room-scoped editor every definition when restricting to owned attributes is off', async () => {
					restrictToOwned(false);
					const store = holding({});

					await expect(service.listRoomAssignableAttributes('r1', fakeActor, 'edit-room-abac-attributes')).resolves.toHaveLength(2);
					expect(store.entitlementsOf).not.toHaveBeenCalled();
				});

				it('offers an editor holding the ABAC admin permissions every definition', async () => {
					const store = holding({});

					await expect(service.listRoomAssignableAttributes('r1', fakeActor, 'manage-abac-admin-rooms')).resolves.toEqual([
						{ key: 'dept', values: ['eng', 'sales'] },
						{ key: 'region', values: ['emea', 'apac'] },
					]);
					expect(store.entitlementsOf).not.toHaveBeenCalled();
				});
			});
		});

		describe('under the Virtru PDP', () => {
			beforeEach(() => {
				mockHasModule.mockReturnValue(true);
				Object.assign(service as any, {
					abacEnabled: true,
					pdpTypeSetting: 'virtru',
					attributeStoreSetting: 'virtru',
					pdpType: 'virtru',
					pdp: { isAvailable: jest.fn().mockResolvedValue(true) },
				});
			});

			it('offers exactly what Virtru entitles the actor to, without reading local definitions', async () => {
				(service as any).attributeStores.virtru.store = {
					entitlementsOf: jest.fn().mockResolvedValue(
						new Map([
							['region', new Set(['emea'])],
							['dept', new Set(['sales'])],
						]),
					),
				};

				await expect(service.listAssignableAttributes(fakeActor)).resolves.toEqual([
					{ key: 'dept', values: ['sales'] },
					{ key: 'region', values: ['emea'] },
				]);
				expect(mockAbacFind).not.toHaveBeenCalled();
			});

			it('fails rather than offering nothing when the entitlements call fails', async () => {
				(service as any).attributeStores.virtru.store = {
					entitlementsOf: jest.fn().mockRejectedValue(new AbacEntityResolutionFailedError()),
				};

				await expect(service.listAssignableAttributes(fakeActor)).rejects.toThrow(AbacEntityResolutionFailedError);
			});

			it('offers every definition with the local attribute store, since the PDP decides at creation', async () => {
				Object.assign(service as any, { attributeStoreSetting: 'local' });
				const store = holding({});

				await expect(service.listAssignableAttributes(fakeActor)).resolves.toHaveLength(2);
				expect(store.entitlementsOf).not.toHaveBeenCalled();
			});
		});
	});

	describe('auditRoomAttributesAtCreation', () => {
		const room = { _id: 'r1', name: 'room', abacAttributes: [{ key: 'dept', values: ['eng'] }] };

		beforeEach(() => {
			mockCreateAuditServerEvent.mockReset();
		});

		it('records the attributes a room was created with', async () => {
			mockHasPermission.mockReset().mockResolvedValue(false);

			await service.auditRoomAttributesAtCreation(room, fakeActor);

			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'abac.object.attribute.changed',
				expect.objectContaining({ change: 'created', reason: 'api', previous: [], current: room.abacAttributes }),
				expect.objectContaining({ _id: fakeActor._id }),
			);
		});

		it('records that the creator bypassed store validation', async () => {
			mockHasPermission.mockReset().mockResolvedValue(true);

			await service.auditRoomAttributesAtCreation(room, fakeActor);

			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'abac.object.attribute.changed',
				expect.objectContaining({ reason: 'store-validation-bypassed' }),
				expect.anything(),
			);
		});
	});

	describe('previewCreationMembers', () => {
		const attributes = [{ key: 'dept', values: ['eng'] }];
		const creator = { _id: fakeActor._id, username: fakeActor.username, name: 'Creator', emails: [] };
		const alice = { _id: 'alice', username: 'alice', name: 'Alice', emails: [] };
		const bob = { _id: 'bob', username: 'bob', name: 'Bob', emails: [] };

		const usePdp = (evaluateSubjectsAgainstAttributes: jest.Mock) => {
			(service as any).pdp = { isAvailable: jest.fn().mockResolvedValue(true), evaluateSubjectsAgainstAttributes };
			return evaluateSubjectsAgainstAttributes;
		};

		const holding = (held: string[]) => {
			const store = { entitlementsOf: jest.fn().mockResolvedValue(new Map([['dept', new Set(held)]])) };
			(service as any).attributeStores.local.store = store;
			return store;
		};

		beforeEach(() => {
			mockAbacFind.mockReturnValue({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }] });
			mockUsersFind.mockReset().mockReturnValue({ toArray: async () => [creator, alice, bob] });
			mockHasPermission.mockReset().mockResolvedValue(false);
			mockSettingsGet.mockImplementation(async (id: string) => (id === 'ABAC_Restrict_To_Owned_Attributes' ? true : undefined));
			holding(['eng']);
		});

		it('evaluates the creator together with the members', async () => {
			const evaluate = usePdp(jest.fn().mockResolvedValue({ compliant: ['test-user', 'alice'], nonCompliant: ['bob'], inconclusive: [] }));

			const result = await service.previewCreationMembers(['alice', 'bob'], attributes, fakeActor);

			expect(mockUsersFind.mock.calls[0][0]).toEqual({ $or: [{ _id: 'test-user' }, { username: { $in: ['alice', 'bob'] } }] });
			expect(evaluate).toHaveBeenCalledWith([creator, alice, bob], attributes, expect.anything());
			expect(result).toEqual({
				allowed: true,
				preview: {
					compliant: [
						{ _id: 'test-user', username: 'testuser', name: 'Creator' },
						{ _id: 'alice', username: 'alice', name: 'Alice' },
					],
					nonCompliant: [{ _id: 'bob', username: 'bob', name: 'Bob' }],
					inconclusive: [],
					creator: 'compliant',
				},
			});
		});

		it('reports the creator who would not be added', async () => {
			usePdp(jest.fn().mockResolvedValue({ compliant: ['alice'], nonCompliant: [], inconclusive: ['test-user', 'bob'] }));

			const result = await service.previewCreationMembers(['alice', 'bob'], attributes, fakeActor);

			expect(result).toMatchObject({ allowed: true, preview: { creator: 'inconclusive' } });
		});

		it('refuses when no PDP is configured, rather than reporting everyone as compliant', async () => {
			(service as any).pdp = null;

			await expect(service.previewCreationMembers(['alice'], attributes, fakeActor)).resolves.toEqual({
				allowed: false,
				reason: 'unavailable',
				code: 'error-pdp-unavailable',
			});
			expect(mockUsersFind).not.toHaveBeenCalled();
		});

		it('refuses when the PDP is unavailable', async () => {
			(service as any).pdp = { isAvailable: jest.fn().mockResolvedValue(false), evaluateSubjectsAgainstAttributes: jest.fn() };

			await expect(service.previewCreationMembers(['alice'], attributes, fakeActor)).resolves.toMatchObject({
				allowed: false,
				reason: 'unavailable',
			});
		});

		it('reports decisions as unavailable when the evaluation fails', async () => {
			usePdp(jest.fn().mockRejectedValue(new Error('virtru down')));

			await expect(service.previewCreationMembers(['alice'], attributes, fakeActor)).resolves.toEqual({
				allowed: false,
				reason: 'unavailable',
				code: 'error-pdp-unavailable',
			});
		});

		it('refuses values the creator may not assign, before evaluating anyone', async () => {
			const evaluate = usePdp(jest.fn());

			await expect(service.previewCreationMembers(['alice'], [{ key: 'dept', values: ['sales'] }], fakeActor)).resolves.toEqual({
				allowed: false,
				reason: 'not-entitled',
				code: 'error-invalid-attribute-values',
				attributes: [{ key: 'dept', values: ['sales'] }],
			});
			expect(evaluate).not.toHaveBeenCalled();
			expect(mockUsersFind).not.toHaveBeenCalled();
		});

		it('previews values the creator does not hold when restricting to owned attributes is off', async () => {
			mockSettingsGet.mockImplementation(async () => false);
			const evaluate = usePdp(jest.fn().mockResolvedValue({ compliant: ['alice'], nonCompliant: ['test-user'], inconclusive: [] }));

			const result = await service.previewCreationMembers(['alice'], [{ key: 'dept', values: ['sales'] }], fakeActor);

			expect(evaluate).toHaveBeenCalled();
			expect(result).toMatchObject({ allowed: true, preview: { creator: 'nonCompliant' } });
		});

		it('refuses attributes that do not exist', async () => {
			const evaluate = usePdp(jest.fn());

			await expect(service.previewCreationMembers(['alice'], [{ key: 'region', values: ['emea'] }], fakeActor)).resolves.toMatchObject({
				allowed: false,
				reason: 'invalid',
			});
			expect(evaluate).not.toHaveBeenCalled();
		});
	});

	describe('previewRoomMembers', () => {
		const room = { _id: 'r1', t: 'p', name: 'room', abacAttributes: [{ key: 'dept', values: ['eng'] }] };
		const adding = { dept: ['eng', 'sales'] };
		const required = [{ key: 'dept', values: ['eng', 'sales'] }];
		const page: AbacRoomMembershipPreviewPage = { count: 10 };
		const listed = {
			members: [{ _id: 'alice', username: 'alice', name: 'ALICE', verdict: 'nonCompliant' }],
			checked: 4,
			total: 9,
			next: { _id: 'alice', username: 'alice' },
		};

		const previewAs = (
			attributes: Record<string, string[]>,
			over: Partial<AbacRoomMembershipPreviewPage> = {},
			grant: AbacRoomAttributesGrant = 'manage-abac-admin-rooms',
		) => service.previewRoomMembers('r1', attributes, fakeActor, { ...page, ...over }, grant);

		const usePdp = (pdp: { previewRoomMembers?: jest.Mock; evaluateSubjectsAgainstAttributes?: jest.Mock } = {}) => {
			const mocks = {
				needsEvaluation: jest.fn(({ added }) => added),
				previewRoomMembers: pdp.previewRoomMembers ?? jest.fn().mockResolvedValue(listed),
				evaluateSubjectsAgainstAttributes:
					pdp.evaluateSubjectsAgainstAttributes ??
					jest.fn().mockResolvedValue({ compliant: [], nonCompliant: [fakeActor._id], inconclusive: [] }),
			};
			(service as any).pdp = { isAvailable: jest.fn().mockResolvedValue(true), ...mocks };
			return mocks;
		};

		beforeEach(() => {
			mockFindOneByIdAndType.mockResolvedValue(room);
			mockAbacFind.mockReturnValue({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales', 'ops'] }] });
			mockHasPermission.mockReset().mockResolvedValue(false);
			mockUsersFindOne.mockReset().mockResolvedValue(null);
			mockSubscriptionsFindByRoomIdAndUserIds.mockReset().mockReturnValue({ toArray: async () => [] });
		});

		it('asks the PDP for one page against the attributes the change sets', async () => {
			const { previewRoomMembers } = usePdp();

			const preview = await previewAs(adding, { count: 2, group: 'loses' });

			expect(previewRoomMembers).toHaveBeenCalledWith(room, required, { count: 2, group: 'loses' });
			expect(preview).toEqual({ ...listed, count: 1 });
		});

		it("attaches each listed member's room roles, from one lookup for the page", async () => {
			mockSubscriptionsFindByRoomIdAndUserIds.mockReturnValue({ toArray: async () => [{ u: { _id: 'alice' }, roles: ['owner'] }] });
			usePdp();

			const preview = await previewAs(adding);

			expect(mockSubscriptionsFindByRoomIdAndUserIds).toHaveBeenCalledTimes(1);
			expect(mockSubscriptionsFindByRoomIdAndUserIds).toHaveBeenCalledWith('r1', ['alice'], expect.anything());
			expect(preview.members).toEqual([{ ...listed.members[0], roles: ['owner'] }]);
		});

		it('leaves roles out for members who hold none, and skips the lookup for an empty page', async () => {
			mockSubscriptionsFindByRoomIdAndUserIds.mockReturnValue({ toArray: async () => [{ u: { _id: 'alice' }, roles: [] }] });
			usePdp();

			expect((await previewAs(adding)).members[0]).not.toHaveProperty('roles');

			mockSubscriptionsFindByRoomIdAndUserIds.mockClear();
			usePdp({ previewRoomMembers: jest.fn().mockResolvedValue({ ...listed, members: [] }) });

			await previewAs(adding);

			expect(mockSubscriptionsFindByRoomIdAndUserIds).not.toHaveBeenCalled();
		});

		it('does not look up the editor on later pages and searches', async () => {
			usePdp();

			await previewAs(adding, { after: { _id: 'alice', username: 'alice' } });
			await previewAs(adding, { filter: 'a' });

			expect(mockUsersFindOne).not.toHaveBeenCalled();
		});

		it('evaluates against nothing when the change adds nothing, as the write evicts nobody', async () => {
			mockFindOneByIdAndType.mockResolvedValue({ ...room, abacAttributes: required });
			const { previewRoomMembers } = usePdp();

			await previewAs({ dept: ['eng'] });

			expect(previewRoomMembers).toHaveBeenCalledWith(expect.anything(), [], expect.anything());
		});

		it("reports the editor's own verdict when they are a member", async () => {
			const editor = { _id: fakeActor._id, username: 'testuser', name: 'Test', emails: [] };
			mockUsersFindOne.mockResolvedValue(editor);
			const { evaluateSubjectsAgainstAttributes } = usePdp();

			const preview = await previewAs(adding);

			expect(mockUsersFindOne.mock.calls[0][0]).toEqual({ _id: fakeActor._id, __rooms: 'r1' });
			expect(evaluateSubjectsAgainstAttributes).toHaveBeenCalledWith([editor], required, room);
			expect(preview.editor).toBe('nonCompliant');
		});

		it('leaves out the editor when they are not a member', async () => {
			usePdp();

			const preview = await previewAs(adding);

			expect(preview).not.toHaveProperty('editor');
		});

		it('refuses attributes the write would refuse, before asking the PDP', async () => {
			const { previewRoomMembers } = usePdp();

			await expect(previewAs({ region: ['emea'] })).rejects.toThrow();
			expect(previewRoomMembers).not.toHaveBeenCalled();
		});

		it("refuses a room-scoped editor a value they do not hold, as the room's write does", async () => {
			mockSettingsGet.mockImplementation(async (id: string) => id === 'ABAC_Restrict_To_Owned_Attributes');
			(service as any).attributeStores.local.store.entitlementsOf = jest.fn().mockResolvedValue(new Map([['dept', new Set(['eng'])]]));
			const { previewRoomMembers } = usePdp();

			await expect(previewAs(adding, {}, 'edit-room-abac-attributes')).rejects.toMatchObject({
				code: 'error-invalid-attribute-values',
				details: { attributes: [{ key: 'dept', values: ['sales'] }] },
			});
			expect(previewRoomMembers).not.toHaveBeenCalled();
		});

		it('reports decisions as unavailable when the PDP fails', async () => {
			usePdp({ previewRoomMembers: jest.fn().mockRejectedValue(new Error('virtru down')) });

			await expect(previewAs(adding)).rejects.toMatchObject({
				code: 'error-pdp-unavailable',
			});
		});
	});

	describe('onRoomAttributesChanged', () => {
		const room = { _id: 'r1', name: 'room', t: 'p', teamMain: false, abacAttributes: [{ key: 'dept', values: ['eng'] }] };
		const attributes = [{ key: 'dept', values: ['eng', 'sales'] }];
		const evicting = (count: number) => {
			const users = Array.from({ length: count }, (_, i) => ({ _id: `u${i}`, username: `user${i}` }));
			(service as any).pdp = { onRoomAttributesChanged: jest.fn().mockResolvedValue(users) };
			return users;
		};

		beforeEach(() => {
			mockRoomRemoveUserFromRoom.mockReset().mockResolvedValue(undefined);
		});

		it('keeps one message per removed member below the threshold', async () => {
			evicting(4);

			await (service as any).onRoomAttributesChanged(room, attributes, fakeActor);

			expect(mockRoomRemoveUserFromRoom).toHaveBeenCalledTimes(4);
			expect(mockRoomRemoveUserFromRoom.mock.calls.every(([, , options]) => !options.skipSystemMessage)).toBe(true);
			expect(mockSaveSystemMessage).not.toHaveBeenCalled();
		});

		it('replaces the per-member messages with one that names nobody from the threshold on', async () => {
			evicting(5);

			await (service as any).onRoomAttributesChanged(room, attributes, fakeActor);

			expect(mockRoomRemoveUserFromRoom.mock.calls.every(([, , options]) => options.skipSystemMessage === true)).toBe(true);
			expect(mockSaveSystemMessage).toHaveBeenCalledTimes(1);
			expect(mockSaveSystemMessage).toHaveBeenCalledWith('abac-removed-users-from-room', 'r1', '5', fakeActor);
		});

		it('counts only the members actually removed', async () => {
			evicting(6);
			mockRoomRemoveUserFromRoom.mockRejectedValueOnce(new Error('app prevented'));

			await (service as any).onRoomAttributesChanged(room, attributes, fakeActor);

			expect(mockSaveSystemMessage).toHaveBeenCalledWith('abac-removed-users-from-room', 'r1', '5', fakeActor);
		});

		it('keeps one message per removed member when no one made the change', async () => {
			evicting(6);

			await (service as any).onRoomAttributesChanged(room, attributes);

			expect(mockRoomRemoveUserFromRoom.mock.calls.every(([, , options]) => !options.skipSystemMessage)).toBe(true);
			expect(mockSaveSystemMessage).not.toHaveBeenCalled();
		});
	});

	describe('checkUsernamesMatchAttributes', () => {
		beforeEach(() => {
			mockUsersFind.mockReset();
			mockCreateAuditServerEvent.mockReset();
		});

		const attributes = [{ key: 'dept', values: ['eng'] }];

		it('returns early (no query) when usernames array is empty', async () => {
			await expect(
				service.checkUsernamesMatchAttributes([], attributes as any, { _id: 'xxxxx', name: 'name' } as any),
			).resolves.toBeUndefined();
			expect(mockUsersFind).not.toHaveBeenCalled();
		});

		it('returns early (no query) when attributes array is empty', async () => {
			await expect(service.checkUsernamesMatchAttributes(['alice'], [], { _id: 'xxxxx', name: 'name' } as any)).resolves.toBeUndefined();
			expect(mockUsersFind).not.toHaveBeenCalled();
		});

		it('resolves when all provided usernames are compliant (query returns empty)', async () => {
			const usernames = ['alice', 'bob'];
			mockUsersFind.mockImplementationOnce(() => ({
				map: () => ({
					toArray: async () => [],
				}),
			}));

			await expect(
				service.checkUsernamesMatchAttributes(usernames, attributes as any, { _id: 'xxxxx', name: 'name' } as any),
			).resolves.toBeUndefined();

			expect(mockUsersFind).toHaveBeenCalledWith(
				{
					username: { $in: usernames },
					$or: [
						{
							abacAttributes: {
								$not: {
									$elemMatch: {
										key: 'dept',
										values: { $all: ['eng'] },
									},
								},
							},
						},
					],
				},
				{ projection: { username: 1 } },
			);
		});

		it('rejects with error-only-compliant-users-can-be-added-to-abac-rooms and details for non-compliant users', async () => {
			const usernames = ['alice', 'bob', 'charlie'];
			const nonCompliantDocs = [{ username: 'bob' }, { username: 'charlie' }];
			mockUsersFind.mockImplementationOnce(() => ({
				map: (fn: (u: any) => string) => ({
					toArray: async () => nonCompliantDocs.map(fn),
				}),
			}));

			await expect(
				service.checkUsernamesMatchAttributes(usernames, attributes as any, { _id: 'xxxxx', name: 'name' } as any),
			).rejects.toMatchObject({
				code: 'error-only-compliant-users-can-be-added-to-abac-rooms',
			});
		});

		it('generates an audit log for every compliant username', async () => {
			const usernames = ['alice', 'bob'];

			mockUsersFind.mockImplementationOnce(() => ({
				map: () => ({
					toArray: async () => [],
				}),
			}));

			await expect(
				service.checkUsernamesMatchAttributes(usernames, attributes as any, { _id: 'xxxxx', name: 'name' } as any),
			).resolves.toBeUndefined();

			expect(mockCreateAuditServerEvents).toHaveBeenCalledTimes(1);
			const calledUsernames = auditedEvents().map(({ data }: any) => data.subject.username);
			expect(calledUsernames.sort()).toEqual(usernames.sort());
		});

		it('does not generate audit logs when usernames do not match attributes', async () => {
			const usernames = ['alice', 'bob', 'charlie'];
			const nonCompliantDocs = [{ username: 'alice' }, { username: 'bob' }, { username: 'charlie' }];

			mockUsersFind.mockImplementationOnce(() => ({
				map: (fn: (u: any) => string) => ({
					toArray: async () => nonCompliantDocs.map(fn),
				}),
			}));

			await expect(
				service.checkUsernamesMatchAttributes(usernames, attributes as any, { _id: 'xxxxx', name: 'name' } as any),
			).rejects.toMatchObject({
				code: 'error-only-compliant-users-can-be-added-to-abac-rooms',
			});

			expect(mockCreateAuditServerEvents).not.toHaveBeenCalled();
		});
	});

	describe('PDP down (fail-closed)', () => {
		const usePdp = (over: Record<string, jest.Mock> = {}) => {
			const pdp = {
				isAvailable: jest.fn().mockResolvedValue(true),
				checkUsernamesMatchAttributes: jest.fn().mockResolvedValue(undefined),
				onRoomAttributesChanged: jest.fn().mockResolvedValue([]),
				needsEvaluation: jest.fn(({ added }) => added),
				onSubjectAttributesChanged: jest.fn().mockResolvedValue([]),
				evaluateUserRooms: jest.fn().mockResolvedValue([]),
				...over,
			} as any;
			(service as any).pdp = pdp;
			return pdp;
		};

		const room = { _id: 'r1', name: 'room', t: 'p', teamMain: false, abacAttributes: [{ key: 'dept', values: ['eng'] }] } as any;
		const attributes = [{ key: 'dept', values: ['eng'] }];

		describe('checkUsernamesMatchAttributes', () => {
			it('rejects with error-pdp-unavailable and skips the decision call when the PDP is unavailable', async () => {
				const pdp = usePdp({ isAvailable: jest.fn().mockResolvedValue(false) });

				await expect(service.checkUsernamesMatchAttributes(['alice'], attributes as any, room)).rejects.toMatchObject({
					code: 'error-pdp-unavailable',
				});
				expect(pdp.checkUsernamesMatchAttributes).not.toHaveBeenCalled();
				expect(mockCreateAuditServerEvents).not.toHaveBeenCalled();
			});

			it('propagates the error (invite blocked) and writes no audit when the decision call fails', async () => {
				const pdp = usePdp({ checkUsernamesMatchAttributes: jest.fn().mockRejectedValue(new Error('virtru down')) });

				await expect(service.checkUsernamesMatchAttributes(['alice'], attributes as any, room)).rejects.toThrow('virtru down');
				expect(pdp.checkUsernamesMatchAttributes).toHaveBeenCalled();
				expect(mockCreateAuditServerEvents).not.toHaveBeenCalled();
			});
		});

		describe('onRoomAttributesChanged', () => {
			it('swallows the PDP error and removes nobody', async () => {
				const pdp = usePdp({ onRoomAttributesChanged: jest.fn().mockRejectedValue(new Error('virtru down')) });

				await expect((service as any).onRoomAttributesChanged(room, attributes)).resolves.toBeUndefined();
				expect(pdp.onRoomAttributesChanged).toHaveBeenCalled();
				expect(mockRoomRemoveUserFromRoom).not.toHaveBeenCalled();
			});
		});

		describe('onSubjectAttributesChanged', () => {
			const subject = { _id: 'u1', __rooms: ['r1'] } as any;

			it('swallows the PDP error and removes nobody', async () => {
				const pdp = usePdp({ onSubjectAttributesChanged: jest.fn().mockRejectedValue(new Error('virtru down')) });

				await expect((service as any).onSubjectAttributesChanged(subject, [])).resolves.toBeUndefined();
				expect(pdp.onSubjectAttributesChanged).toHaveBeenCalled();
				expect(mockRoomRemoveUserFromRoom).not.toHaveBeenCalled();
			});

			it('returns early without calling the PDP when it reports unavailable', async () => {
				const pdp = usePdp({ isAvailable: jest.fn().mockResolvedValue(false) });

				await expect((service as any).onSubjectAttributesChanged(subject, [])).resolves.toBeUndefined();
				expect(pdp.onSubjectAttributesChanged).not.toHaveBeenCalled();
			});
		});

		describe('evaluateRoomMembership', () => {
			it('swallows the PDP error and removes nobody', async () => {
				const pdp = usePdp({ evaluateUserRooms: jest.fn().mockRejectedValue(new Error('virtru down')) });
				mockRoomsFindAllPrivateAbac.mockReturnValue({ toArray: async () => [room] });
				mockUsersFindActiveByRoomIds.mockReturnValue({
					map: (fn: (u: any) => any) => ({ toArray: async () => [{ _id: 'u1', __rooms: ['r1'] }].map(fn) }),
				});

				await expect(service.evaluateRoomMembership()).resolves.toBeUndefined();
				expect(pdp.evaluateUserRooms).toHaveBeenCalled();
				expect(mockRoomRemoveUserFromRoom).not.toHaveBeenCalled();
			});
		});
	});

	describe('batched membership filters', () => {
		const attributes = [{ key: 'dept', values: ['eng'] }];
		const room = { _id: 'r1', name: 'room', abacAttributes: attributes };
		const plainRoom = { _id: 'r0', name: 'plain' };

		const usePdp = (over: Record<string, jest.Mock> = {}) => {
			const pdp = {
				isAvailable: jest.fn().mockResolvedValue(true),
				evaluateSubjectsAgainstAttributes: jest.fn().mockResolvedValue({ compliant: [], nonCompliant: [], inconclusive: [] }),
				evaluateSubjectAgainstRooms: jest.fn().mockResolvedValue({ compliant: [], nonCompliant: [], inconclusive: [] }),
				...over,
			} as any;
			(service as any).pdp = pdp;
			return pdp;
		};

		const auditedPairs = () => auditedEvents().map(({ data }: any) => `${data.subject.username}@${data.object._id}`);

		beforeEach(() => {
			mockUsersFind.mockReset();
			mockUsersFindOneById.mockReset();
			mockCreateAuditServerEvents.mockReset();
		});

		describe('filterUsersAllowedInRoom', () => {
			const subjects = [
				{ _id: 'u1', username: 'alice' },
				{ _id: 'u2', username: 'bob' },
				{ _id: 'u3', username: 'carol' },
			];

			beforeEach(() => {
				mockUsersFind.mockReturnValue({ toArray: async () => subjects });
			});

			it('admits every user to a room without attributes, without asking the PDP', async () => {
				const pdp = usePdp();

				await expect(service.filterUsersAllowedInRoom(['u1', 'u2'], plainRoom)).resolves.toEqual(['u1', 'u2']);
				expect(pdp.isAvailable).not.toHaveBeenCalled();
			});

			it('evaluates every user in one PDP call and keeps only the compliant ones, in input order', async () => {
				const pdp = usePdp({
					evaluateSubjectsAgainstAttributes: jest
						.fn()
						.mockResolvedValue({ compliant: ['u3', 'u1'], nonCompliant: ['u2'], inconclusive: [] }),
				});

				await expect(service.filterUsersAllowedInRoom(['u1', 'u2', 'u3'], room)).resolves.toEqual(['u1', 'u3']);
				expect(pdp.evaluateSubjectsAgainstAttributes).toHaveBeenCalledTimes(1);
				expect(pdp.evaluateSubjectsAgainstAttributes).toHaveBeenCalledWith(subjects, attributes, room);
				expect(mockUsersFind).toHaveBeenCalledWith(
					{ _id: { $in: ['u1', 'u2', 'u3'] } },
					{ projection: { _id: 1, username: 1, emails: 1 } },
				);
			});

			it('refuses the inconclusive users', async () => {
				usePdp({
					evaluateSubjectsAgainstAttributes: jest
						.fn()
						.mockResolvedValue({ compliant: ['u1'], nonCompliant: [], inconclusive: ['u2', 'u3'] }),
				});

				await expect(service.filterUsersAllowedInRoom(['u1', 'u2', 'u3'], room)).resolves.toEqual(['u1']);
			});

			it('writes one audit entry per admitted user', async () => {
				usePdp({
					evaluateSubjectsAgainstAttributes: jest
						.fn()
						.mockResolvedValue({ compliant: ['u1', 'u3'], nonCompliant: ['u2'], inconclusive: [] }),
				});

				await service.filterUsersAllowedInRoom(['u1', 'u2', 'u3'], room);

				expect(mockCreateAuditServerEvents).toHaveBeenCalledTimes(1);
				expect(auditedPairs().sort()).toEqual(['alice@r1', 'carol@r1']);
			});

			it('refuses everyone without asking when there is no PDP', async () => {
				(service as any).pdp = null;

				await expect(service.filterUsersAllowedInRoom(['u1'], room)).resolves.toEqual([]);
				expect(mockUsersFind).not.toHaveBeenCalled();
			});

			it('refuses everyone without asking when the PDP is unavailable', async () => {
				const pdp = usePdp({ isAvailable: jest.fn().mockResolvedValue(false) });

				await expect(service.filterUsersAllowedInRoom(['u1'], room)).resolves.toEqual([]);
				expect(pdp.evaluateSubjectsAgainstAttributes).not.toHaveBeenCalled();
			});

			it('refuses everyone and writes no audit when the decision call fails', async () => {
				usePdp({ evaluateSubjectsAgainstAttributes: jest.fn().mockRejectedValue(new Error('virtru down')) });

				await expect(service.filterUsersAllowedInRoom(['u1', 'u2'], room)).resolves.toEqual([]);
				expect(mockCreateAuditServerEvents).not.toHaveBeenCalled();
			});
		});

		describe('filterRoomsAllowedForUser', () => {
			const subject = { _id: 'u1', username: 'alice' };
			const otherRoom = { _id: 'r2', name: 'other', abacAttributes: attributes };

			beforeEach(() => {
				mockUsersFindOneById.mockResolvedValue(subject);
			});

			it('admits every room without attributes, without asking the PDP', async () => {
				const pdp = usePdp();

				await expect(service.filterRoomsAllowedForUser('u1', [plainRoom])).resolves.toEqual(['r0']);
				expect(pdp.isAvailable).not.toHaveBeenCalled();
			});

			it('evaluates only the attributed rooms, in one PDP call, and keeps the compliant ones in input order', async () => {
				const pdp = usePdp({
					evaluateSubjectAgainstRooms: jest.fn().mockResolvedValue({ compliant: ['r2'], nonCompliant: ['r1'], inconclusive: [] }),
				});

				await expect(service.filterRoomsAllowedForUser('u1', [room, plainRoom, otherRoom])).resolves.toEqual(['r0', 'r2']);
				expect(pdp.evaluateSubjectAgainstRooms).toHaveBeenCalledTimes(1);
				expect(pdp.evaluateSubjectAgainstRooms).toHaveBeenCalledWith(subject, [room, otherRoom]);
			});

			it('refuses the inconclusive rooms', async () => {
				usePdp({
					evaluateSubjectAgainstRooms: jest.fn().mockResolvedValue({ compliant: ['r1'], nonCompliant: [], inconclusive: ['r2'] }),
				});

				await expect(service.filterRoomsAllowedForUser('u1', [room, otherRoom])).resolves.toEqual(['r1']);
			});

			it('writes one audit entry per admitted attributed room', async () => {
				usePdp({
					evaluateSubjectAgainstRooms: jest.fn().mockResolvedValue({ compliant: ['r1', 'r2'], nonCompliant: [], inconclusive: [] }),
				});

				await service.filterRoomsAllowedForUser('u1', [room, plainRoom, otherRoom]);

				expect(mockCreateAuditServerEvents).toHaveBeenCalledTimes(1);
				expect(auditedPairs().sort()).toEqual(['alice@r1', 'alice@r2']);
			});

			it('keeps only the rooms without attributes when there is no PDP', async () => {
				(service as any).pdp = null;

				await expect(service.filterRoomsAllowedForUser('u1', [room, plainRoom])).resolves.toEqual(['r0']);
			});

			it('keeps only the rooms without attributes when the PDP is unavailable', async () => {
				const pdp = usePdp({ isAvailable: jest.fn().mockResolvedValue(false) });

				await expect(service.filterRoomsAllowedForUser('u1', [room, plainRoom])).resolves.toEqual(['r0']);
				expect(pdp.evaluateSubjectAgainstRooms).not.toHaveBeenCalled();
			});

			it('keeps only the rooms without attributes when the user does not exist', async () => {
				mockUsersFindOneById.mockResolvedValue(null);
				const pdp = usePdp();

				await expect(service.filterRoomsAllowedForUser('u1', [room, plainRoom])).resolves.toEqual(['r0']);
				expect(pdp.evaluateSubjectAgainstRooms).not.toHaveBeenCalled();
			});

			it('keeps only the rooms without attributes and writes no audit when the decision call fails', async () => {
				usePdp({ evaluateSubjectAgainstRooms: jest.fn().mockRejectedValue(new Error('virtru down')) });

				await expect(service.filterRoomsAllowedForUser('u1', [room, plainRoom])).resolves.toEqual(['r0']);
				expect(mockCreateAuditServerEvents).not.toHaveBeenCalled();
			});
		});
	});

	describe('listAbacRooms', () => {
		const actor = { _id: 'admin-1', username: 'admin', name: 'Admin' };

		const roomA = { _id: 'rA', t: 'p', name: 'alpha', abacAttributes: [{ key: 'dept', values: ['eng'] }] } as any;
		const roomB = { _id: 'rB', t: 'p', name: 'beta', abacAttributes: [{ key: 'dept', values: ['sales'] }] } as any;
		const roomC = { _id: 'rC', t: 'p', name: 'gamma', abacAttributes: [{ key: 'dept', values: ['hr'] }] } as any;

		const localStore = { scopeRoomsPage: async (rooms: any[]) => rooms };

		const asVirtru = (svc: AbacService) => {
			mockHasModule.mockReturnValue(true);
			Object.assign(svc as any, { abacEnabled: true, pdpTypeSetting: 'virtru', attributeStoreSetting: 'virtru' });
		};

		beforeEach(() => {
			mockRoomsFindPaginated.mockReset();
			(service as any).attributeStores.local.store = localStore;
		});

		it('calls Rooms.findPaginated with the base query and pagination, ignoring actor', async () => {
			mockRoomsFindPaginated.mockReturnValue({
				cursor: { toArray: async () => [roomA] },
				totalCount: Promise.resolve(1),
			});

			await service.listAbacRooms({ offset: 0, count: 10 }, actor);

			expect(mockRoomsFindPaginated).toHaveBeenCalledWith(
				{ t: 'p', abacAttributes: { $exists: true, $ne: [] } },
				{ skip: 0, limit: 10, sort: { name: 1 } },
			);
		});

		it('local mode: returns rooms byte-identical to the Mongo page (identity pass-through)', async () => {
			mockRoomsFindPaginated.mockReturnValue({
				cursor: { toArray: async () => [roomA, roomB] },
				totalCount: Promise.resolve(2),
			});

			const result = await service.listAbacRooms({ offset: 0, count: 25 }, actor);

			expect(result).toEqual({ rooms: [roomA, roomB], offset: 0, count: 2, total: 2 });
			expect(result.rooms[0]).toBe(roomA);
			expect(result.rooms[1]).toBe(roomB);
			for (const r of result.rooms) {
				expect((r as any).abacAttributesRedacted).toBeUndefined();
			}
		});

		it('virtru mode: permitted rooms are unchanged, denied rooms are redacted', async () => {
			asVirtru(service);
			const fakeStore = {
				scopeRoomsPage: jest
					.fn()
					.mockImplementation(async (rooms: any[]) =>
						rooms.map((r) => (r._id === 'rB' ? { ...r, abacAttributes: [], abacAttributesRedacted: true } : r)),
					),
			};
			(service as any).attributeStores.virtru.store = fakeStore;

			mockRoomsFindPaginated.mockReturnValue({
				cursor: { toArray: async () => [roomA, roomB, roomC] },
				totalCount: Promise.resolve(10),
			});

			const result = await service.listAbacRooms({ offset: 5, count: 3 }, actor);

			expect(result.rooms).toHaveLength(3);
			expect(result.total).toBe(10);
			expect(result.offset).toBe(5);
			expect(result.count).toBe(3);

			const permitted = result.rooms.find((r) => r._id === 'rA');
			expect(permitted).toEqual(roomA);
			expect((permitted as any).abacAttributesRedacted).toBeUndefined();

			const denied = result.rooms.find((r) => r._id === 'rB');
			expect(denied?.abacAttributes).toEqual([]);
			expect((denied as any).abacAttributesRedacted).toBe(true);

			const alsoPermitted = result.rooms.find((r) => r._id === 'rC');
			expect(alsoPermitted).toEqual(roomC);
		});

		it('virtru mode: order of rooms is preserved after scoping', async () => {
			asVirtru(service);
			const ordered = [roomC, roomA, roomB];
			const fakeStore = {
				scopeRoomsPage: jest
					.fn()
					.mockResolvedValue(ordered.map((r) => (r._id === 'rA' ? { ...r, abacAttributes: [], abacAttributesRedacted: true } : r))),
			};
			(service as any).attributeStores.virtru.store = fakeStore;

			mockRoomsFindPaginated.mockReturnValue({
				cursor: { toArray: async () => ordered },
				totalCount: Promise.resolve(3),
			});

			const result = await service.listAbacRooms({ offset: 0, count: 25 }, actor);

			expect(result.rooms.map((r) => r._id)).toEqual(['rC', 'rA', 'rB']);
		});

		it('virtru mode: total and offset are not changed by scoping', async () => {
			asVirtru(service);
			const fakeStore = {
				scopeRoomsPage: jest.fn().mockResolvedValue([{ ...roomA, abacAttributes: [], abacAttributesRedacted: true }]),
			};
			(service as any).attributeStores.virtru.store = fakeStore;

			mockRoomsFindPaginated.mockReturnValue({
				cursor: { toArray: async () => [roomA] },
				totalCount: Promise.resolve(99),
			});

			const result = await service.listAbacRooms({ offset: 20, count: 1 }, actor);

			expect(result.total).toBe(99);
			expect(result.offset).toBe(20);
			expect(result.count).toBe(1);
		});
	});

	describe('scopeRoomsForAdmin', () => {
		const actor = { _id: 'admin-1', username: 'admin', name: 'Admin' };

		const roomA = { _id: 'rA', abacAttributes: [{ key: 'dept', values: ['eng'] }] } as any;
		const roomB = { _id: 'rB', abacAttributes: [{ key: 'dept', values: ['sales'] }] } as any;

		it('always delegates to attributeStore.scopeRoomsPage (local store is a no-op pass-through)', async () => {
			const fakeStore = { scopeRoomsPage: jest.fn().mockImplementation(async (rooms: any[]) => rooms) };
			(service as any).attributeStores.local.store = fakeStore;

			const input = [roomA, roomB];
			const result = await service.scopeRoomsForAdmin(input, actor);

			expect(fakeStore.scopeRoomsPage).toHaveBeenCalledWith(input, actor);
			expect(result).toEqual([roomA, roomB]);
		});
	});

	describe('attribute store selection', () => {
		const buildSettings = (overrides: Record<string, any>) =>
			({
				Abac_Cache_Decision_Time_Seconds: 60,
				ABAC_Enabled: true,
				ABAC_PDP_Type: 'virtru',
				ABAC_Attribute_Store: 'virtru',
				ABAC_Virtru_Base_URL: '',
				ABAC_Virtru_Client_ID: '',
				ABAC_Virtru_Client_Secret: '',
				ABAC_Virtru_OIDC_Endpoint: '',
				ABAC_Virtru_Default_Entity_Key: 'emailAddress',
				ABAC_Virtru_Attribute_Namespace: 'example.com',
				...overrides,
			}) as Record<string, any>;

		const drive = async (settings: Record<string, any>) => {
			mockSettingsGet.mockImplementation(async (key: string) => settings[key]);
			const svc = new AbacService();
			await svc.started();
			return svc;
		};

		beforeEach(() => {
			(LocalAttributeStore as jest.Mock).mockClear();
			(VirtruAttributeStore as jest.Mock).mockClear();
			(VirtruClient as jest.Mock).mockClear();
			mockHasModule.mockReset();
			mockSettingsGet.mockReset();
		});

		it('selects the virtru store when license + all three settings are virtru/enabled', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await drive(buildSettings({}));
			expect(await svc.isExternalAttributeStore()).toBe(true);
		});

		it('falls back to the local store when the license module is absent', async () => {
			mockHasModule.mockReturnValue(false);
			const svc = await drive(buildSettings({}));
			expect(await svc.isExternalAttributeStore()).toBe(false);
		});

		it('falls back to the local store when ABAC_Enabled is false', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await drive(buildSettings({ ABAC_Enabled: false }));
			expect(await svc.isExternalAttributeStore()).toBe(false);
		});

		it('falls back to the local store when ABAC_PDP_Type is not virtru', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await drive(buildSettings({ ABAC_PDP_Type: 'local' }));
			expect(await svc.isExternalAttributeStore()).toBe(false);
		});

		it('falls back to the local store when ABAC_Attribute_Store is not virtru', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await drive(buildSettings({ ABAC_Attribute_Store: 'local' }));
			expect(await svc.isExternalAttributeStore()).toBe(false);
		});

		it('reuses the same long-lived VirtruClient across local->virtru->local PDP flips', async () => {
			mockHasModule.mockReturnValue(true);
			mockSettingsGet.mockImplementation(async (key: string) => buildSettings({ ABAC_PDP_Type: 'local' })[key]);
			const svc = new AbacService();
			await svc.started();

			expect(VirtruClient).toHaveBeenCalledTimes(1);

			svc.setPdpStrategy('virtru');
			svc.setPdpStrategy('local');
			svc.setPdpStrategy('virtru');

			expect(VirtruClient).toHaveBeenCalledTimes(1);
		});
	});

	describe('attribute store transition detection', () => {
		const buildSettings = (overrides: Record<string, any>) =>
			({
				Abac_Cache_Decision_Time_Seconds: 60,
				ABAC_Enabled: true,
				ABAC_PDP_Type: 'virtru',
				ABAC_Attribute_Store: 'virtru',
				ABAC_Virtru_Base_URL: '',
				ABAC_Virtru_Client_ID: '',
				ABAC_Virtru_Client_Secret: '',
				ABAC_Virtru_OIDC_Endpoint: '',
				ABAC_Virtru_Default_Entity_Key: 'emailAddress',
				ABAC_Virtru_Attribute_Namespace: 'example.com',
				...overrides,
			}) as Record<string, any>;

		let transitionSpy: jest.SpyInstance;

		beforeEach(() => {
			(LocalAttributeStore as jest.Mock).mockClear();
			(VirtruAttributeStore as jest.Mock).mockClear();
			(VirtruClient as jest.Mock).mockClear();
			mockHasModule.mockReset();
			mockSettingsGet.mockReset();
			transitionSpy = jest.spyOn(AbacService.prototype as any, 'onAttributeStoreTransition').mockResolvedValue(undefined);
		});

		afterEach(() => {
			transitionSpy.mockRestore();
		});

		const bootWith = async (settings: Record<string, any>) => {
			mockSettingsGet.mockImplementation(async (key: string) => settings[key]);
			const svc = new AbacService();
			await svc.started();
			return svc;
		};

		type SettingCb = (arg: { setting: { value: unknown } }) => void | Promise<void>;
		const fireSettingChanged = async (svc: AbacService, settingName: string, value: unknown): Promise<void> => {
			const { calls }: { calls: [string, SettingCb][] } = (svc as any).onSettingChanged.mock;
			const entry = calls.find(([name]) => name === settingName);
			if (!entry) throw new Error(`No listener registered for ${settingName}`);
			await entry[1]({ setting: { value } });
		};

		it('does not treat boot into virtru as a transition', async () => {
			mockHasModule.mockReturnValue(true);
			await bootWith(buildSettings({}));
			expect(transitionSpy).not.toHaveBeenCalled();
		});

		it('does not fire on a steady-state re-evaluation via the real ABAC_Attribute_Store listener (same value)', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({}));
			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			expect(transitionSpy).not.toHaveBeenCalled();
		});

		it('fires exactly once when ABAC_Attribute_Store flips local->virtru via the real listener', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));
			expect(transitionSpy).not.toHaveBeenCalled();

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');

			expect(transitionSpy).toHaveBeenCalledTimes(1);
			expect(transitionSpy).toHaveBeenCalledWith('local', 'virtru');
		});

		it('fires exactly once when ABAC_Attribute_Store flips virtru->local via the real listener', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({}));
			expect(transitionSpy).not.toHaveBeenCalled();

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'local');

			expect(transitionSpy).toHaveBeenCalledTimes(1);
			expect(transitionSpy).toHaveBeenCalledWith('virtru', 'local');
		});

		it('does NOT fire when ABAC_Enabled flips false->true via the real listener (Store setting does not change)', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({ ABAC_Enabled: false }));
			expect(transitionSpy).not.toHaveBeenCalled();

			await fireSettingChanged(svc, 'ABAC_Enabled', true);

			expect(transitionSpy).not.toHaveBeenCalled();
		});

		it('fires local->virtru when ABAC_PDP_Type flips local->virtru while Store=virtru (effective store transitions)', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({ ABAC_PDP_Type: 'local' }));
			expect(transitionSpy).not.toHaveBeenCalled();

			await fireSettingChanged(svc, 'ABAC_PDP_Type', 'virtru');

			expect(transitionSpy).toHaveBeenCalledTimes(1);
			expect(transitionSpy).toHaveBeenCalledWith('local', 'virtru');
		});

		it('does NOT fire when ABAC_PDP_Type flips local->virtru while Store=local (effective store stays local)', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({ ABAC_PDP_Type: 'local', ABAC_Attribute_Store: 'local' }));
			expect(transitionSpy).not.toHaveBeenCalled();

			await fireSettingChanged(svc, 'ABAC_PDP_Type', 'virtru');

			expect(transitionSpy).not.toHaveBeenCalled();
		});
	});

	describe('attribute-store transition wipe (onAttributeStoreTransition)', () => {
		const buildSettings = (overrides: Record<string, any>) =>
			({
				Abac_Cache_Decision_Time_Seconds: 60,
				ABAC_Enabled: true,
				ABAC_PDP_Type: 'virtru',
				ABAC_Attribute_Store: 'virtru',
				ABAC_Virtru_Base_URL: '',
				ABAC_Virtru_Client_ID: '',
				ABAC_Virtru_Client_Secret: '',
				ABAC_Virtru_OIDC_Endpoint: '',
				ABAC_Virtru_Default_Entity_Key: 'emailAddress',
				ABAC_Virtru_Attribute_Namespace: 'example.com',
				...overrides,
			}) as Record<string, any>;

		let auditSpy: jest.SpyInstance;
		let evictionSpy: jest.SpyInstance;
		let pdpRoomAttrsSpy: jest.Mock;

		beforeEach(() => {
			(LocalAttributeStore as jest.Mock).mockClear();
			(VirtruAttributeStore as jest.Mock).mockClear();
			(VirtruClient as jest.Mock).mockClear();
			mockHasModule.mockReset();
			mockSettingsGet.mockReset();
			mockRoomsUnsetAllAbacAttributes.mockReset();
			mockCreateAuditServerEvent.mockReset();
			auditSpy = jest.spyOn(Audit, 'attributeStoreSwitched').mockResolvedValue(undefined);
			evictionSpy = jest.spyOn(AbacService.prototype as any, 'onRoomAttributesChanged').mockResolvedValue(undefined);
			pdpRoomAttrsSpy = jest.fn();
		});

		afterEach(() => {
			auditSpy.mockRestore();
			evictionSpy.mockRestore();
		});

		const bootWith = async (settings: Record<string, any>) => {
			mockSettingsGet.mockImplementation(async (key: string) => settings[key]);
			const svc = new AbacService();
			(svc as any).pdp = { onRoomAttributesChanged: pdpRoomAttrsSpy, canAccessObject: jest.fn(), isAvailable: jest.fn() };
			await svc.started();
			return svc;
		};

		type SettingCb = (arg: { setting: { value: unknown } }) => void | Promise<void>;
		const fireSettingChanged = async (svc: AbacService, settingName: string, value: unknown): Promise<void> => {
			const { calls }: { calls: [string, SettingCb][] } = (svc as any).onSettingChanged.mock;
			const entry = calls.find(([name]) => name === settingName);
			if (!entry) throw new Error(`No listener registered for ${settingName}`);
			await entry[1]({ setting: { value } });
		};

		const setVirtruMode = (svc: AbacService) => {
			(svc as any).lastEffectiveStore = 'virtru';
			(svc as any).attributeStoreSetting = 'virtru';
			(svc as any).pdpTypeSetting = 'virtru';
			(svc as any).abacEnabled = true;
		};

		it('wipes and audits (local->virtru, N) when ABAC_Attribute_Store flips local->virtru via the real listener', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUnsetAllAbacAttributes.mockResolvedValue({ modifiedCount: 7 });
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).toHaveBeenCalledTimes(1);
			expect(mockRoomsUnsetAllAbacAttributes).toHaveBeenCalledWith();
			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy).toHaveBeenCalledWith('local', 'virtru', 7);
		});

		it('wipes and audits (virtru->local, N) when ABAC_Attribute_Store explicitly set to local while other conditions stay virtru', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUnsetAllAbacAttributes.mockResolvedValue({ modifiedCount: 5 });
			const svc = await bootWith(buildSettings({}));
			setVirtruMode(svc);

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'local');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).toHaveBeenCalledTimes(1);
			expect(mockRoomsUnsetAllAbacAttributes).toHaveBeenCalledWith();
			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy).toHaveBeenCalledWith('virtru', 'local', 5);
		});

		it('skips the wipe and audit when the abac license is absent at Store-setting change time', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			mockHasModule.mockReturnValue(false);
			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does not block the settings-save: the listener returns before the wipe resolves, audit fires after', async () => {
			mockHasModule.mockReturnValue(true);
			let resolveWipe: (value: { modifiedCount: number }) => void = () => undefined;
			mockRoomsUnsetAllAbacAttributes.mockReturnValue(
				new Promise<{ modifiedCount: number }>((resolve) => {
					resolveWipe = resolve;
				}),
			);
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			const { calls }: { calls: [string, (arg: { setting: { value: unknown } }) => void][] } = (svc as any).onSettingChanged.mock;
			const entry = calls.find(([name]) => name === 'ABAC_Attribute_Store');
			if (!entry) throw new Error('No listener registered for ABAC_Attribute_Store');

			entry[1]({ setting: { value: 'virtru' } });
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).toHaveBeenCalledTimes(1);
			expect(auditSpy).not.toHaveBeenCalled();

			resolveWipe({ modifiedCount: 4 });
			await new Promise((r) => setImmediate(r));

			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy).toHaveBeenCalledWith('local', 'virtru', 4);
		});

		it('never triggers eviction / PDP / per-room audit during the local->virtru wipe', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUnsetAllAbacAttributes.mockResolvedValue({ modifiedCount: 12 });
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(evictionSpy).not.toHaveBeenCalled();
			expect(pdpRoomAttrsSpy).not.toHaveBeenCalled();
			expect(mockCreateAuditServerEvent).not.toHaveBeenCalled();
		});

		it('does not emit an audit when the wipe reports modifiedCount: 0 (loser node in multi-node fan-out)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUnsetAllAbacAttributes.mockResolvedValue({ modifiedCount: 0 });
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).toHaveBeenCalledTimes(1);
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does not run the wipe on boot or on unrelated setting changes', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({}));
			await new Promise((r) => setImmediate(r));
			expect(mockRoomsUnsetAllAbacAttributes).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();

			await fireSettingChanged(svc, 'ABAC_Virtru_Attribute_Namespace', 'other.example');
			await new Promise((r) => setImmediate(r));
			expect(mockRoomsUnsetAllAbacAttributes).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('wipes virtru->local when ABAC_PDP_Type flips to local while Store=virtru (effective store transitions)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUnsetAllAbacAttributes.mockResolvedValue({ modifiedCount: 4 });
			const svc = await bootWith(buildSettings({}));
			setVirtruMode(svc);

			await fireSettingChanged(svc, 'ABAC_PDP_Type', 'local');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).toHaveBeenCalledTimes(1);
			expect(mockRoomsUnsetAllAbacAttributes).toHaveBeenCalledWith();
			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy).toHaveBeenCalledWith('virtru', 'local', 4);
		});

		it('does NOT wipe when ABAC_PDP_Type flips to local while Store=local (effective store stays local)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUnsetAllAbacAttributes.mockResolvedValue({ modifiedCount: 9 });
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_PDP_Type', 'local');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does NOT wipe or audit when ABAC_Enabled changes while Store stays virtru', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({}));
			setVirtruMode(svc);

			await fireSettingChanged(svc, 'ABAC_Enabled', false);
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does NOT wipe when ABAC_Attribute_Store flips local->virtru while ABAC_Enabled is false (effective store stays local)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUnsetAllAbacAttributes.mockResolvedValue({ modifiedCount: 9 });
			const svc = await bootWith(buildSettings({ ABAC_Enabled: false, ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does NOT wipe when ABAC_Attribute_Store flips local->virtru while ABAC_PDP_Type is local (effective store stays local)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUnsetAllAbacAttributes.mockResolvedValue({ modifiedCount: 9 });
			const svc = await bootWith(buildSettings({ ABAC_PDP_Type: 'local', ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does NOT wipe when ABAC_Attribute_Store flips virtru->local while the virtru store was never effective (PDP=local)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUnsetAllAbacAttributes.mockResolvedValue({ modifiedCount: 9 });
			const svc = await bootWith(buildSettings({ ABAC_PDP_Type: 'local', ABAC_Attribute_Store: 'virtru' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'local');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUnsetAllAbacAttributes).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});
	});

	describe('ABAC_PDP_Type→local cascade to ABAC_Attribute_Store', () => {
		const buildSettings = (overrides: Record<string, any>) =>
			({
				Abac_Cache_Decision_Time_Seconds: 60,
				ABAC_Enabled: true,
				ABAC_PDP_Type: 'virtru',
				ABAC_Attribute_Store: 'virtru',
				ABAC_Virtru_Base_URL: '',
				ABAC_Virtru_Client_ID: '',
				ABAC_Virtru_Client_Secret: '',
				ABAC_Virtru_OIDC_Endpoint: '',
				ABAC_Virtru_Default_Entity_Key: 'emailAddress',
				ABAC_Virtru_Attribute_Namespace: 'example.com',
				...overrides,
			}) as Record<string, any>;

		const bootWith = async (settings: Record<string, any>) => {
			mockSettingsGet.mockImplementation(async (key: string) => settings[key]);
			const svc = new AbacService();
			await svc.started();
			return svc;
		};

		type SettingCb = (arg: { setting: { value: unknown } }) => void | Promise<void>;
		const fireSettingChanged = async (svc: AbacService, settingName: string, value: unknown): Promise<void> => {
			const { calls }: { calls: [string, SettingCb][] } = (svc as any).onSettingChanged.mock;
			const entry = calls.find(([name]) => name === settingName);
			if (!entry) throw new Error(`No listener registered for ${settingName}`);
			await entry[1]({ setting: { value } });
		};

		beforeEach(() => {
			mockSettingsGet.mockReset();
			mockSettingsSet.mockReset().mockResolvedValue({ modifiedCount: 1 });
		});

		it('writes ABAC_Attribute_Store=local when PDP changes to local and Store was virtru', async () => {
			const svc = await bootWith(buildSettings({}));

			await fireSettingChanged(svc, 'ABAC_PDP_Type', 'local');

			expect(mockSettingsSet).toHaveBeenCalledTimes(1);
			expect(mockSettingsSet).toHaveBeenCalledWith('ABAC_Attribute_Store', 'local');
		});

		it('does NOT write ABAC_Attribute_Store when PDP changes to local and Store is already local (idempotent)', async () => {
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_PDP_Type', 'local');

			expect(mockSettingsSet).not.toHaveBeenCalled();
		});

		it('does NOT write ABAC_Attribute_Store when PDP changes to virtru (one-way cascade only)', async () => {
			const svc = await bootWith(buildSettings({ ABAC_PDP_Type: 'local', ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_PDP_Type', 'virtru');

			expect(mockSettingsSet).not.toHaveBeenCalled();
		});

		it('resolves normally when the settings write fails', async () => {
			const svc = await bootWith(buildSettings({}));
			mockSettingsSet.mockRejectedValueOnce(new Error('db-write-failure'));
			const pdpStrategySpy = jest.spyOn(svc as any, 'setPdpStrategy');

			await expect(fireSettingChanged(svc, 'ABAC_PDP_Type', 'local')).resolves.toBeUndefined();

			expect(pdpStrategySpy).toHaveBeenCalledWith('local');
		});
	});

	describe('reevaluateUsers', () => {
		const usersCursor = (items: any[]) => ({ toArray: () => Promise.resolve(items) });

		it('local PDP: forwards resolved user ids to the LDAP broker and removes nothing', async () => {
			service.setPdpStrategy('local');
			mockUsersFindUsersByIdentifiers.mockReturnValue(usersCursor([{ _id: 'u1' }, { _id: 'u2' }]));

			await service.reevaluateUsers({ usernames: ['bob'] });

			expect(mockUsersFindUsersByIdentifiers).toHaveBeenCalledWith(
				{ usernames: ['bob'] },
				{ projection: { _id: 1, emails: 1, username: 1, __rooms: 1 } },
			);
			expect(mockLdapSyncByIds).toHaveBeenCalledWith(['u1', 'u2']);
			expect(mockRoomRemoveUserFromRoom).not.toHaveBeenCalled();
		});

		it('virtru PDP: removes the non-compliant pairs the PDP returns', async () => {
			service.setPdpStrategy('virtru');
			const u1 = { _id: 'u1', emails: [{ address: 'u1@x.com' }], username: 'u1' };
			const room = { _id: 'r1', abacAttributes: [] };
			mockUsersFindUsersByIdentifiers.mockReturnValue(usersCursor([u1]));
			mockRoomRemoveUserFromRoom.mockResolvedValue(undefined);
			jest.spyOn((service as any).pdp, 'isAvailable').mockResolvedValue(true);
			jest.spyOn((service as any).pdp, 'reevaluateUsers').mockResolvedValue([{ user: u1, room }]);

			await service.reevaluateUsers({ ids: ['u1'] });

			expect(mockRoomRemoveUserFromRoom).toHaveBeenCalledTimes(1);
		});

		it('no-ops when no users match', async () => {
			service.setPdpStrategy('local');
			mockUsersFindUsersByIdentifiers.mockReturnValue(usersCursor([]));

			await service.reevaluateUsers({ ids: ['missing'] });

			expect(mockLdapSyncByIds).not.toHaveBeenCalled();
			expect(mockRoomRemoveUserFromRoom).not.toHaveBeenCalled();
		});
	});
});
