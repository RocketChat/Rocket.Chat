import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { FilterOperators } from 'mongodb';

import { addQueryRestrictionsToDepartmentsModel } from './addRoleBasedRestrictionsToDepartment';
import { getUnitsFromUser } from './getUnitsFromUser';
import { defaultLogger } from '../utils/logger';

// Mock dependencies
jest.mock('./getUnitsFromUser');
jest.mock('../utils/logger');

const mockedGetUnitsFromUser = jest.mocked(getUnitsFromUser);
const mockedLogger = jest.mocked(defaultLogger);

describe('addQueryRestrictionsToDepartmentsModel', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('when getUnitsFromUser returns an array of units', () => {
		it('should add unit restrictions to the query', async () => {
			// Arrange
			const userId = 'user123';
			const units = ['unit1', 'unit2', 'unit3'];
			const originalQuery: FilterOperators<ILivechatDepartment> = { name: 'test-department' };

			mockedGetUnitsFromUser.mockResolvedValue(units);

			// Act
			const result = await addQueryRestrictionsToDepartmentsModel(originalQuery, userId);

			// Assert
			expect(result).toEqual({
				$and: [
					{ name: 'test-department' },
					{ type: { $ne: 'u' } },
					{
						$or: [{ ancestors: { $in: ['unit1', 'unit2', 'unit3'] } }, { _id: { $in: ['unit1', 'unit2', 'unit3'] } }],
					},
				],
			});

			expect(mockedGetUnitsFromUser).toHaveBeenCalledWith(userId);
			expect(mockedLogger.debug).toHaveBeenCalledWith({
				msg: 'Applying department query restrictions',
				userId,
				units,
			});
		});

		it('should work with empty original query', async () => {
			// Arrange
			const userId = 'user456';
			const units = ['unit4', 'unit5'];

			mockedGetUnitsFromUser.mockResolvedValue(units);

			// Act
			const result = await addQueryRestrictionsToDepartmentsModel({}, userId);

			// Assert
			expect(result).toEqual({
				$and: [
					{},
					{ type: { $ne: 'u' } },
					{
						$or: [{ ancestors: { $in: ['unit4', 'unit5'] } }, { _id: { $in: ['unit4', 'unit5'] } }],
					},
				],
			});
		});

		it('should work with undefined original query', async () => {
			// Arrange
			const userId = 'user789';
			const units = ['unit6'];

			mockedGetUnitsFromUser.mockResolvedValue(units);

			// Act
			const result = await addQueryRestrictionsToDepartmentsModel(undefined, userId);

			// Assert
			expect(result).toEqual({
				$and: [
					{},
					{ type: { $ne: 'u' } },
					{
						$or: [{ ancestors: { $in: ['unit6'] } }, { _id: { $in: ['unit6'] } }],
					},
				],
			});
		});

		it('should handle single unit in array', async () => {
			// Arrange
			const userId = 'user101';
			const units = ['single-unit'];
			const originalQuery: FilterOperators<ILivechatDepartment> = { enabled: true };

			mockedGetUnitsFromUser.mockResolvedValue(units);

			// Act
			const result = await addQueryRestrictionsToDepartmentsModel(originalQuery, userId);

			// Assert
			expect(result).toEqual({
				$and: [
					{ enabled: true },
					{ type: { $ne: 'u' } },
					{
						$or: [{ ancestors: { $in: ['single-unit'] } }, { _id: { $in: ['single-unit'] } }],
					},
				],
			});
		});
	});

	describe('when getUnitsFromUser returns non-array values', () => {
		it('should not add unit restrictions when getUnitsFromUser returns null', async () => {
			// Arrange
			const userId = 'user202';
			const originalQuery: FilterOperators<ILivechatDepartment> = { name: 'test' };

			mockedGetUnitsFromUser.mockResolvedValue(undefined);

			// Act
			const result = await addQueryRestrictionsToDepartmentsModel(originalQuery, userId);

			// Assert
			expect(result).toEqual({
				$and: [{ name: 'test' }, { type: { $ne: 'u' } }],
			});

			expect(mockedLogger.debug).toHaveBeenCalledWith({
				msg: 'Applying department query restrictions',
				userId,
				units: undefined,
			});
		});

		it('should not add unit restrictions when getUnitsFromUser returns undefined', async () => {
			// Arrange
			const userId = 'user303';
			const originalQuery: FilterOperators<ILivechatDepartment> = { active: true };

			mockedGetUnitsFromUser.mockResolvedValue(undefined);

			// Act
			const result = await addQueryRestrictionsToDepartmentsModel(originalQuery, userId);

			// Assert
			expect(result).toEqual({
				$and: [{ active: true }, { type: { $ne: 'u' } }],
			});

			expect(mockedLogger.debug).toHaveBeenCalledWith({
				msg: 'Applying department query restrictions',
				userId,
				units: undefined,
			});
		});

		it('should not add unit restrictions when getUnitsFromUser returns a string', async () => {
			// Arrange
			const userId = 'user404';
			const originalQuery: FilterOperators<ILivechatDepartment> = {};

			mockedGetUnitsFromUser.mockResolvedValue('not-an-array' as any);

			// Act
			const result = await addQueryRestrictionsToDepartmentsModel(originalQuery, userId);

			// Assert
			expect(result).toEqual({
				$and: [{}, { type: { $ne: 'u' } }],
			});

			expect(mockedLogger.debug).toHaveBeenCalledWith({
				msg: 'Applying department query restrictions',
				userId,
				units: 'not-an-array',
			});
		});

		it('should not add unit restrictions when getUnitsFromUser returns empty array', async () => {
			// Arrange
			const userId = 'user505';
			const originalQuery: FilterOperators<ILivechatDepartment> = { department: 'support' };

			mockedGetUnitsFromUser.mockResolvedValue([]);

			// Act
			const result = await addQueryRestrictionsToDepartmentsModel(originalQuery, userId);

			// Assert
			expect(result).toEqual({
				$and: [
					{ department: 'support' },
					{ type: { $ne: 'u' } },
					{
						$or: [{ ancestors: { $in: [] } }, { _id: { $in: [] } }],
					},
				],
			});

			expect(mockedLogger.debug).toHaveBeenCalledWith({
				msg: 'Applying department query restrictions',
				userId,
				units: [],
			});
		});
	});

	describe('error handling', () => {
		it('should propagate errors from getUnitsFromUser', async () => {
			// Arrange
			const userId = 'user606';
			const error = new Error('Database connection failed');

			mockedGetUnitsFromUser.mockRejectedValue(error);

			// Act & Assert
			await expect(addQueryRestrictionsToDepartmentsModel({}, userId)).rejects.toThrow('Database connection failed');

			expect(mockedGetUnitsFromUser).toHaveBeenCalledWith(userId);
			expect(mockedLogger.debug).not.toHaveBeenCalled();
		});
	});

	describe('complex query scenarios', () => {
		it('should handle complex original query with nested conditions', async () => {
			// Arrange
			const userId = 'user707';
			const units = ['unit-a', 'unit-b'];
			const originalQuery: FilterOperators<ILivechatDepartment> = {
				$or: [{ name: { $regex: 'support' } }, { enabled: true }],
				createdAt: { $gte: new Date('2023-01-01') },
			};

			mockedGetUnitsFromUser.mockResolvedValue(units);

			// Act
			const result = await addQueryRestrictionsToDepartmentsModel(originalQuery, userId);

			// Assert
			expect(result).toEqual({
				$and: [
					{
						$or: [{ name: { $regex: 'support' } }, { enabled: true }],
						createdAt: { $gte: new Date('2023-01-01') },
					},
					{ type: { $ne: 'u' } },
					{
						$or: [{ ancestors: { $in: ['unit-a', 'unit-b'] } }, { _id: { $in: ['unit-a', 'unit-b'] } }],
					},
				],
			});
		});

		it('should always exclude departments with type "u"', async () => {
			// Arrange
			const userId = 'user808';
			const units = ['unit-x'];
			const originalQuery: FilterOperators<ILivechatDepartment> = { type: 'normal' };

			mockedGetUnitsFromUser.mockResolvedValue(units);

			// Act
			const result = await addQueryRestrictionsToDepartmentsModel(originalQuery, userId);

			// Assert
			expect(result.$and).toContainEqual({ type: { $ne: 'u' } });
		});
	});

	describe('logging', () => {
		it('should always call debug logger with correct parameters', async () => {
			// Arrange
			const userId = 'user909';
			const units = ['unit-test'];

			mockedGetUnitsFromUser.mockResolvedValue(units);

			// Act
			await addQueryRestrictionsToDepartmentsModel({}, userId);

			// Assert
			expect(mockedLogger.debug).toHaveBeenCalledTimes(1);
			expect(mockedLogger.debug).toHaveBeenCalledWith({
				msg: 'Applying department query restrictions',
				userId: 'user909',
				units: ['unit-test'],
			});
		});
	});
});
