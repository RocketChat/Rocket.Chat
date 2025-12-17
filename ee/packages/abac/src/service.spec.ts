import { AbacService } from './index';

const fakeActor = { _id: 'test-user', username: 'testuser', type: 'user' };

const mockFindOneByIdAndType = jest.fn();
const mockUpdateAbacConfigurationById = jest.fn();
const mockAbacInsertOne = jest.fn();
const mockAbacFindPaginated = jest.fn();
const mockAbacFindOne = jest.fn();
const mockAbacUpdateOne = jest.fn();
const mockAbacDeleteOne = jest.fn();
const mockRoomsIsAbacAttributeInUse = jest.fn();
const mockSetAbacAttributesById = jest.fn();
const mockAbacFind = jest.fn();
const mockUpdateSingleAbacAttributeValuesById = jest.fn();
const mockUpdateAbacAttributeValuesArrayFilteredById = jest.fn();
const mockRemoveAbacAttributeByRoomIdAndKey = jest.fn();
const mockInsertAbacAttributeIfNotExistsById = jest.fn();
const mockUsersFind = jest.fn();
const mockUsersUpdateOne = jest.fn();
const mockUsersSetAbacAttributesById = jest.fn();
const mockUsersUnsetAbacAttributesById = jest.fn();
const mockAbacFindOneAndUpdate = jest.fn();
const mockCreateAuditServerEvent = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Rooms: {
		findOneByIdAndType: (...args: any[]) => mockFindOneByIdAndType(...args),
		updateAbacConfigurationById: (...args: any[]) => mockUpdateAbacConfigurationById(...args),
		isAbacAttributeInUse: (...args: any[]) => mockRoomsIsAbacAttributeInUse(...args),
		setAbacAttributesById: (...args: any[]) => mockSetAbacAttributesById(...args),
		updateSingleAbacAttributeValuesById: (...args: any[]) => mockUpdateSingleAbacAttributeValuesById(...args),
		updateAbacAttributeValuesArrayFilteredById: (...args: any[]) => mockUpdateAbacAttributeValuesArrayFilteredById(...args),
		removeAbacAttributeByRoomIdAndKey: (...args: any[]) => mockRemoveAbacAttributeByRoomIdAndKey(...args),
		insertAbacAttributeIfNotExistsById: (...args: any[]) => mockInsertAbacAttributeIfNotExistsById(...args),
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
		setAbacAttributesById: (...args: any[]) => mockUsersSetAbacAttributesById(...args),
		unsetAbacAttributesById: (...args: any[]) => mockUsersUnsetAbacAttributesById(...args),
		findOneAndUpdate: (...args: any[]) => mockUsersUpdateOne(...args),
		updateOne: (...args: any[]) => mockUsersUpdateOne(...args),
	},
	ServerEvents: {
		createAuditServerEvent: (...args: any[]) => mockCreateAuditServerEvent(...args),
	},
}));

// Partial mock for @rocket.chat/core-services: keep real MeteorError, override ServiceClass and Room
jest.mock('@rocket.chat/core-services', () => {
	const actual = jest.requireActual('@rocket.chat/core-services');
	return {
		...actual,
		ServiceClass: class {},
		Room: {
			removeUserFromRoom: jest.fn(),
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
		it('returns paginated attributes with defaults (no filters)', async () => {
			const docs = [
				{ _id: '1', key: 'k1', values: ['a', 'b'] },
				{ _id: '2', key: 'k2', values: ['c'] },
			];
			mockAbacFindPaginated.mockReturnValueOnce({
				cursor: { toArray: async () => docs },
				totalCount: Promise.resolve(docs.length),
			});

			const result = await service.listAbacAttributes();
			expect(mockAbacFindPaginated).toHaveBeenCalledWith({}, { projection: { key: 1, values: 1 }, skip: 0, limit: 25 });
			expect(result).toEqual({
				attributes: docs,
				offset: 0,
				count: docs.length,
				total: docs.length,
			});
		});

		it('filters by key only', async () => {
			const docs = [{ _id: '3', key: 'FilterKey', values: ['x'] }];
			mockAbacFindPaginated.mockReturnValueOnce({
				cursor: { toArray: async () => docs },
				totalCount: Promise.resolve(docs.length),
			});

			const result = await service.listAbacAttributes({ key: 'FilterKey' });
			expect(mockAbacFindPaginated).toHaveBeenCalledWith(
				{ $or: [{ key: /FilterKey/i }] },
				{ projection: { key: 1, values: 1 }, skip: 0, limit: 25 },
			);
			expect(result).toEqual({
				attributes: docs,
				offset: 0,
				count: docs.length,
				total: docs.length,
			});
		});

		it('filters by values only with custom pagination', async () => {
			const docs = [
				{ _id: '4', key: 'alpha', values: ['m', 'n'] },
				{ _id: '5', key: 'beta', values: ['n', 'o'] },
			];
			mockAbacFindPaginated.mockReturnValueOnce({
				cursor: { toArray: async () => docs },
				totalCount: Promise.resolve(10),
			});

			const result = await service.listAbacAttributes({ values: 'n,z', offset: 5, count: 2 });
			expect(mockAbacFindPaginated).toHaveBeenCalledWith(
				{ $or: [{ values: /n,z/i }] },
				{ projection: { key: 1, values: 1 }, skip: 5, limit: 2 },
			);
			expect(result).toEqual({
				attributes: docs,
				offset: 5,
				count: docs.length,
				total: 10,
			});
		});

		it('filters by key and values', async () => {
			const docs = [{ _id: '6', key: 'gamma', values: ['p', 'q'] }];
			mockAbacFindPaginated.mockReturnValueOnce({
				cursor: { toArray: async () => docs },
				totalCount: Promise.resolve(docs.length),
			});

			const result = await service.listAbacAttributes({ key: 'gamma', values: 'q' });
			expect(mockAbacFindPaginated).toHaveBeenCalledWith(
				{ $or: [{ key: /gamma/i }, { values: /q/i }] },
				{ projection: { key: 1, values: 1 }, skip: 0, limit: 25 },
			);
			expect(result).toEqual({
				attributes: docs,
				offset: 0,
				count: docs.length,
				total: docs.length,
			});
		});

		it('returns empty when no documents match', async () => {
			mockAbacFindPaginated.mockReturnValueOnce({
				cursor: { toArray: async () => [] },
				totalCount: Promise.resolve(0),
			});

			const result = await service.listAbacAttributes({ key: 'nope', values: 'none' });
			expect(result).toEqual({
				attributes: [],
				offset: 0,
				count: 0,
				total: 0,
			});
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
});
