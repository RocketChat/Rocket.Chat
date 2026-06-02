import { Audit } from './audit';
import { VirtruClient } from './clients/virtru/VirtruClient';
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
const mockUpdateAbacConfigurationById = jest.fn();
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
const mockRoomsUpdateMany = jest.fn();
const mockSettingsSet = jest.fn();
const mockUsersFind = jest.fn();
const mockUsersUpdateOne = jest.fn();
const mockUsersSetAbacAttributesById = jest.fn();
const mockUsersUnsetAbacAttributesById = jest.fn();
const mockAbacFindOneAndUpdate = jest.fn();
const mockCreateAuditServerEvent = jest.fn();
const mockRoomsFindAllPrivateAbac = jest.fn();
const mockUsersFindActiveByRoomIds = jest.fn();
const mockRoomRemoveUserFromRoom = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Rooms: {
		findOneByIdAndType: (...args: any[]) => mockFindOneByIdAndType(...args),
		updateAbacConfigurationById: (...args: any[]) => mockUpdateAbacConfigurationById(...args),
		isAbacAttributeInUse: (...args: any[]) => mockRoomsIsAbacAttributeInUse(...args),
		findPaginated: (...args: any[]) => mockRoomsFindPaginated(...args),
		setAbacAttributesById: (...args: any[]) => mockSetAbacAttributesById(...args),
		updateSingleAbacAttributeValuesById: (...args: any[]) => mockUpdateSingleAbacAttributeValuesById(...args),
		updateAbacAttributeValuesArrayFilteredById: (...args: any[]) => mockUpdateAbacAttributeValuesArrayFilteredById(...args),
		removeAbacAttributeByRoomIdAndKey: (...args: any[]) => mockRemoveAbacAttributeByRoomIdAndKey(...args),
		insertAbacAttributeIfNotExistsById: (...args: any[]) => mockInsertAbacAttributeIfNotExistsById(...args),
		unsetAbacAttributesById: (...args: any[]) => mockUnsetAbacAttributesById(...args),
		updateMany: (...args: any[]) => mockRoomsUpdateMany(...args),
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
		findActiveByRoomIds: (...args: any[]) => mockUsersFindActiveByRoomIds(...args),
		setAbacAttributesById: (...args: any[]) => mockUsersSetAbacAttributesById(...args),
		unsetAbacAttributesById: (...args: any[]) => mockUsersUnsetAbacAttributesById(...args),
		findOneAndUpdate: (...args: any[]) => mockUsersUpdateOne(...args),
		updateOne: (...args: any[]) => mockUsersUpdateOne(...args),
	},
	ServerEvents: {
		createAuditServerEvent: (...args: any[]) => mockCreateAuditServerEvent(...args),
	},
	Settings: {
		updateValueById: (...args: any[]) => mockSettingsSet(...args),
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

		it('throws error-cannot-convert-default-room-to-abac when room is default', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], default: true });
			await expect(service.setRoomAbacAttributes('r1', { dept: ['eng'] }, fakeActor)).rejects.toThrow(
				'error-cannot-convert-default-room-to-abac',
			);
			expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
		});

		it('throws error-cannot-convert-default-room-to-abac when room is teamDefault', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], teamDefault: true });
			await expect(service.setRoomAbacAttributes('r1', { dept: ['eng'] }, fakeActor)).rejects.toThrow(
				'error-cannot-convert-default-room-to-abac',
			);
			expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
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

		it('calls onRoomAttributesChanged when adding values to an existing attribute', async () => {
			const existing = [{ key: 'dept', values: ['eng'] }];
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			mockAbacFind.mockReturnValueOnce({
				toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }],
			});

			await service.setRoomAbacAttributes('r1', { dept: ['eng', 'sales'] }, fakeActor); // adding sales

			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(expect.objectContaining({ _id: 'r1' }), [
				{ key: 'dept', values: ['eng', 'sales'] },
			]);
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

		it('throws error-cannot-convert-default-room-to-abac when room is default', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], default: true });
			await expect(service.updateRoomAbacAttributeValues('r1', 'dept', ['eng'], fakeActor)).rejects.toThrow(
				'error-cannot-convert-default-room-to-abac',
			);
		});

		it('throws error-cannot-convert-default-room-to-abac when room is teamDefault', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], teamDefault: true });
			await expect(service.updateRoomAbacAttributeValues('r1', 'dept', ['eng'], fakeActor)).rejects.toThrow(
				'error-cannot-convert-default-room-to-abac',
			);
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
			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(expect.objectContaining({ _id: 'r1' }), [
				{ key: 'dept', values: ['eng', 'sales'] },
			]);
		});

		it('updates existing key and does NOT trigger hook when a value is removed', async () => {
			// Existing attribute loses one value; hook should NOT fire per new behavior
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
			await service.updateRoomAbacAttributeValues('r1', 'dept', ['eng'], fakeActor);
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).toHaveBeenCalledWith('r1', 'dept', ['eng']);
			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
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

		it('throws error-cannot-convert-default-room-to-abac when room is default', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], default: true });
			await expect((service as any).removeRoomAbacAttribute('r1', 'dept', fakeActor)).rejects.toThrow(
				'error-cannot-convert-default-room-to-abac',
			);
			expect(mockRemoveAbacAttributeByRoomIdAndKey).not.toHaveBeenCalled();
		});

		it('throws error-cannot-convert-default-room-to-abac when room is teamDefault', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], teamDefault: true });
			await expect((service as any).removeRoomAbacAttribute('r1', 'dept', fakeActor)).rejects.toThrow(
				'error-cannot-convert-default-room-to-abac',
			);
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

		it('unsets every attribute (not single-key removal) when removing the last remaining attribute', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng'] }] });

			await (service as any).removeRoomAbacAttribute('r1', 'dept', fakeActor);

			expect(mockUnsetAbacAttributesById).toHaveBeenCalledWith('r1');
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

		it('throws error-cannot-convert-default-room-to-abac when room is default', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], default: true });
			await expect((service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor)).rejects.toThrow(
				'error-cannot-convert-default-room-to-abac',
			);
		});

		it('throws error-cannot-convert-default-room-to-abac when room is teamDefault', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], teamDefault: true });
			await expect((service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor)).rejects.toThrow(
				'error-cannot-convert-default-room-to-abac',
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

		it('throws error-cannot-convert-default-room-to-abac when room is default', async () => {
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], default: true });
			await expect(service.addRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor)).rejects.toThrow(
				'error-cannot-convert-default-room-to-abac',
			);
			expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
		});

		it('throws error-cannot-convert-default-room-to-abac when room is teamDefault', async () => {
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [], teamDefault: true });
			await expect(service.addRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor)).rejects.toThrow(
				'error-cannot-convert-default-room-to-abac',
			);
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
			);
		});

		it('inserts new attribute and calls hook with constructed list when DB returns undefined', async () => {
			const existing = [{ key: 'other', values: ['x'] }];
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			mockInsertAbacAttributeIfNotExistsById.mockResolvedValueOnce(undefined);

			await service.addRoomAbacAttributeByKey('r1', 'dept', ['eng'], fakeActor);

			expect(mockInsertAbacAttributeIfNotExistsById).toHaveBeenCalledWith('r1', 'dept', ['eng']);
			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith(expect.objectContaining({ _id: 'r1' }), [
				...existing,
				{ key: 'dept', values: ['eng'] },
			]);
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

			expect(mockCreateAuditServerEvent).toHaveBeenCalledTimes(usernames.length);
			const calledUsernames = mockCreateAuditServerEvent.mock.calls.map(([, payload]: any[]) => payload?.subject?.username).filter(Boolean);
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

			expect(mockCreateAuditServerEvent).not.toHaveBeenCalled();
		});
	});

	describe('PDP down (fail-closed)', () => {
		const usePdp = (over: Record<string, jest.Mock> = {}) => {
			const pdp = {
				isAvailable: jest.fn().mockResolvedValue(true),
				checkUsernamesMatchAttributes: jest.fn().mockResolvedValue(undefined),
				onRoomAttributesChanged: jest.fn().mockResolvedValue([]),
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
				expect(mockCreateAuditServerEvent).not.toHaveBeenCalled();
			});

			it('propagates the error (invite blocked) and writes no audit when the decision call fails', async () => {
				const pdp = usePdp({ checkUsernamesMatchAttributes: jest.fn().mockRejectedValue(new Error('virtru down')) });

				await expect(service.checkUsernamesMatchAttributes(['alice'], attributes as any, room)).rejects.toThrow('virtru down');
				expect(pdp.checkUsernamesMatchAttributes).toHaveBeenCalled();
				expect(mockCreateAuditServerEvent).not.toHaveBeenCalled();
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
			mockRoomsUpdateMany.mockReset();
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
			mockRoomsUpdateMany.mockResolvedValue({ modifiedCount: 7 });
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUpdateMany).toHaveBeenCalledTimes(1);
			expect(mockRoomsUpdateMany).toHaveBeenCalledWith({ abacAttributes: { $exists: true } }, { $unset: { abacAttributes: '' } });
			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy).toHaveBeenCalledWith('local', 'virtru', 7);
		});

		it('wipes and audits (virtru->local, N) when ABAC_Attribute_Store explicitly set to local while other conditions stay virtru', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUpdateMany.mockResolvedValue({ modifiedCount: 5 });
			const svc = await bootWith(buildSettings({}));
			setVirtruMode(svc);

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'local');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUpdateMany).toHaveBeenCalledTimes(1);
			expect(mockRoomsUpdateMany).toHaveBeenCalledWith({ abacAttributes: { $exists: true } }, { $unset: { abacAttributes: '' } });
			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy).toHaveBeenCalledWith('virtru', 'local', 5);
		});

		it('skips updateMany and audit when the abac license is absent at Store-setting change time', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			mockHasModule.mockReturnValue(false);
			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUpdateMany).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does not block the settings-save: the listener returns before updateMany resolves, audit fires after', async () => {
			mockHasModule.mockReturnValue(true);
			let resolveWipe: (value: { modifiedCount: number }) => void = () => undefined;
			mockRoomsUpdateMany.mockReturnValue(
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

			expect(mockRoomsUpdateMany).toHaveBeenCalledTimes(1);
			expect(auditSpy).not.toHaveBeenCalled();

			resolveWipe({ modifiedCount: 4 });
			await new Promise((r) => setImmediate(r));

			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy).toHaveBeenCalledWith('local', 'virtru', 4);
		});

		it('never triggers eviction / PDP / per-room audit during the local->virtru wipe', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUpdateMany.mockResolvedValue({ modifiedCount: 12 });
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(evictionSpy).not.toHaveBeenCalled();
			expect(pdpRoomAttrsSpy).not.toHaveBeenCalled();
			expect(mockCreateAuditServerEvent).not.toHaveBeenCalled();
		});

		it('does not emit an audit when updateMany reports modifiedCount: 0 (loser node in multi-node fan-out)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUpdateMany.mockResolvedValue({ modifiedCount: 0 });
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUpdateMany).toHaveBeenCalledTimes(1);
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does not run the wipe on boot or on unrelated setting changes', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({}));
			await new Promise((r) => setImmediate(r));
			expect(mockRoomsUpdateMany).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();

			await fireSettingChanged(svc, 'ABAC_Virtru_Attribute_Namespace', 'other.example');
			await new Promise((r) => setImmediate(r));
			expect(mockRoomsUpdateMany).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('wipes virtru->local when ABAC_PDP_Type flips to local while Store=virtru (effective store transitions)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUpdateMany.mockResolvedValue({ modifiedCount: 4 });
			const svc = await bootWith(buildSettings({}));
			setVirtruMode(svc);

			await fireSettingChanged(svc, 'ABAC_PDP_Type', 'local');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUpdateMany).toHaveBeenCalledTimes(1);
			expect(mockRoomsUpdateMany).toHaveBeenCalledWith({ abacAttributes: { $exists: true } }, { $unset: { abacAttributes: '' } });
			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy).toHaveBeenCalledWith('virtru', 'local', 4);
		});

		it('does NOT wipe when ABAC_PDP_Type flips to local while Store=local (effective store stays local)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUpdateMany.mockResolvedValue({ modifiedCount: 9 });
			const svc = await bootWith(buildSettings({ ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_PDP_Type', 'local');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUpdateMany).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does NOT wipe or audit when ABAC_Enabled changes while Store stays virtru', async () => {
			mockHasModule.mockReturnValue(true);
			const svc = await bootWith(buildSettings({}));
			setVirtruMode(svc);

			await fireSettingChanged(svc, 'ABAC_Enabled', false);
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUpdateMany).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does NOT wipe when ABAC_Attribute_Store flips local->virtru while ABAC_Enabled is false (effective store stays local)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUpdateMany.mockResolvedValue({ modifiedCount: 9 });
			const svc = await bootWith(buildSettings({ ABAC_Enabled: false, ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUpdateMany).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does NOT wipe when ABAC_Attribute_Store flips local->virtru while ABAC_PDP_Type is local (effective store stays local)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUpdateMany.mockResolvedValue({ modifiedCount: 9 });
			const svc = await bootWith(buildSettings({ ABAC_PDP_Type: 'local', ABAC_Attribute_Store: 'local' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'virtru');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUpdateMany).not.toHaveBeenCalled();
			expect(auditSpy).not.toHaveBeenCalled();
		});

		it('does NOT wipe when ABAC_Attribute_Store flips virtru->local while the virtru store was never effective (PDP=local)', async () => {
			mockHasModule.mockReturnValue(true);
			mockRoomsUpdateMany.mockResolvedValue({ modifiedCount: 9 });
			const svc = await bootWith(buildSettings({ ABAC_PDP_Type: 'local', ABAC_Attribute_Store: 'virtru' }));

			await fireSettingChanged(svc, 'ABAC_Attribute_Store', 'local');
			await new Promise((r) => setImmediate(r));

			expect(mockRoomsUpdateMany).not.toHaveBeenCalled();
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
});
