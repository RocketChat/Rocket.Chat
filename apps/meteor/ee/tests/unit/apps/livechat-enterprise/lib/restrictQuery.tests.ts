import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

type RestrictQueryParams = {
	originalQuery?: Record<string, any>;
	unitsFilter?: string[];
	userId?: string;
};

describe('restrictQuery', () => {
	const modulePath = '../../../../../app/livechat-enterprise/server/lib/restrictQuery';

	// Helper to require the SUT with injected stubs
	const loadSut = ({
		getUnitsFromUserResult,
		departmentsToReturn = [],
		captureFindArgs = false,
	}: {
		getUnitsFromUserResult: any;
		departmentsToReturn?: Array<{ _id: string }>;
		captureFindArgs?: boolean;
	}) => {
		const getUnitsFromUserStub = sinon.stub().callsFake(async () => getUnitsFromUserResult);

		const findArgs: any[] = [];
		const findStub = sinon.stub().callsFake((query: any, projection: any) => {
			if (captureFindArgs) {
				findArgs.push({ query, projection });
			}
			return {
				toArray: async () => departmentsToReturn,
			};
		});

		const debugStub = sinon.stub();

		const { restrictQuery } = proxyquire.noCallThru().load(modulePath, {
			'@rocket.chat/models': {
				LivechatDepartment: { find: findStub },
			},
			'@rocket.chat/omni-core-ee': {
				getUnitsFromUser: getUnitsFromUserStub,
			},
			'./logger': {
				cbLogger: { debug: debugStub },
			},
		});

		return { restrictQuery, getUnitsFromUserStub, findStub, debugStub, findArgs };
	};

	afterEach(() => {
		sinon.restore();
	});

	it('returns the original query untouched when user has no units and no unitsFilter is provided', async () => {
		const { restrictQuery, getUnitsFromUserStub, findStub, debugStub } = loadSut({
			getUnitsFromUserResult: null,
		});

		const originalQuery = { status: 'open' };
		const result = await (restrictQuery as (p: RestrictQueryParams) => Promise<any>)({
			originalQuery,
			userId: 'user-id',
		});

		expect(getUnitsFromUserStub.calledOnce).to.equal(true);
		expect(getUnitsFromUserStub.firstCall.args).to.deep.equal(['user-id']);
		expect(findStub.called).to.equal(false);
		expect(debugStub.called).to.equal(false);

		// It must be a shallow copy but equivalent content
		expect(result).to.deep.equal(originalQuery);
		// Ensure original wasn't mutated
		expect(originalQuery).to.not.have.property('$and');
	});

	it('returns the original query untouched when user has no units and no unitsFilter is provided', async () => {
		const { restrictQuery, getUnitsFromUserStub, findStub, debugStub } = loadSut({
			getUnitsFromUserResult: null,
		});

		const result = await (restrictQuery as (p: RestrictQueryParams) => Promise<any>)({
			originalQuery: undefined,
			userId: 'user-id',
		});

		expect(getUnitsFromUserStub.calledOnce).to.equal(true);
		expect(getUnitsFromUserStub.firstCall.args).to.deep.equal(['user-id']);
		expect(findStub.called).to.equal(false);
		expect(debugStub.called).to.equal(false);

		// It must be a shallow copy but equivalent content
		expect(result).to.deep.equal({});
	});

	it('applies departmentAncestors filter directly when user has no units but a unitsFilter is provided', async () => {
		const { restrictQuery, getUnitsFromUserStub, findStub, debugStub } = loadSut({
			getUnitsFromUserResult: undefined,
		});

		const originalQuery = { status: { $ne: 'closed' } };
		const unitsFilter = ['unit-a', 'unit-b'];
		const result = await (restrictQuery as (p: RestrictQueryParams) => Promise<any>)({
			originalQuery,
			unitsFilter,
		});

		expect(getUnitsFromUserStub.calledOnce).to.equal(true);
		expect(findStub.called).to.equal(false);
		expect(debugStub.called).to.equal(false);

		expect(result).to.deep.equal({
			status: { $ne: 'closed' },
			departmentAncestors: { $in: unitsFilter },
		});
		// Ensure original wasn't mutated
		expect(originalQuery).to.not.have.property('departmentAncestors');
	});

	it('adds $and restriction when user has units and no unitsFilter is provided', async () => {
		const { restrictQuery, findArgs, debugStub } = loadSut({
			getUnitsFromUserResult: ['unit-1', 'unit-2'],
			departmentsToReturn: [{ _id: 'dep-1' }, { _id: 'dep-2' }],
			captureFindArgs: true,
		});

		const originalQuery = { status: 'open' };
		const result = await (restrictQuery as (p: RestrictQueryParams) => Promise<any>)({
			originalQuery,
			userId: 'u',
		});

		// Verify LivechatDepartment.find was called with the proper query and projection
		expect(findArgs).to.have.length(1);
		expect(findArgs[0].query).to.deep.equal({
			$or: [{ ancestors: { $in: ['unit-1', 'unit-2'] } }, { _id: { $in: ['unit-1', 'unit-2'] } }],
		});
		expect(findArgs[0].projection).to.deep.equal({ projection: { _id: 1 } });

		// Verify the resulting query
		expect(result).to.have.property('$and').that.is.an('array').with.lengthOf(1);
		expect(result.$and[0]).to.deep.equal({
			$or: [
				{ departmentAncestors: { $in: ['unit-1', 'unit-2'] } },
				{ departmentId: { $in: ['dep-1', 'dep-2'] } },
				{ departmentId: { $exists: false } },
			],
		});
		expect(result.status).to.equal('open');

		// Logger should be called with the final query and computed userUnits
		expect(debugStub.callCount).to.equal(1);
		const debugArg = debugStub.firstCall.args[0];
		expect(debugArg).to.include({ msg: 'Applying room query restrictions' });
		expect(debugArg.userUnits).to.deep.equal(['unit-1', 'unit-2']);
		expect(debugArg.query).to.deep.equal(result);
	});

	it('intersects user units with unitsFilter and applies restrictions accordingly', async () => {
		const { restrictQuery, findArgs, debugStub } = loadSut({
			getUnitsFromUserResult: ['unit-1', 'unit-2'],
			departmentsToReturn: [{ _id: 'dep-3' }],
			captureFindArgs: true,
		});

		const result = await (restrictQuery as (p: RestrictQueryParams) => Promise<any>)({
			originalQuery: { priority: 'high' },
			unitsFilter: ['unit-2', 'unit-3'], // intersection => ['unit-2']
			userId: 'u',
		});

		// find must be called using the intersected set ['unit-2']
		expect(findArgs).to.have.length(1);
		expect(findArgs[0].query).to.deep.equal({
			$or: [{ ancestors: { $in: ['unit-2'] } }, { _id: { $in: ['unit-2'] } }],
		});

		// Resulting $and must use the intersected units as well
		expect(result.$and).to.have.length(1);
		expect(result.$and[0]).to.deep.equal({
			$or: [{ departmentAncestors: { $in: ['unit-2'] } }, { departmentId: { $in: ['dep-3'] } }, { departmentId: { $exists: false } }],
		});
		expect(result.priority).to.equal('high');

		expect(debugStub.callCount).to.equal(1);
		const debugArg = debugStub.firstCall.args[0];
		expect(debugArg.userUnits).to.deep.equal(['unit-2']);
	});

	it('places the new restriction before existing $and expressions and preserves other fields', async () => {
		const { restrictQuery } = loadSut({
			getUnitsFromUserResult: ['u-a'],
			departmentsToReturn: [{ _id: 'dep-a' }],
		});

		const originalQuery = { $and: [{ foo: 1 }], bar: 2 };
		const result = await (restrictQuery as (p: RestrictQueryParams) => Promise<any>)({
			originalQuery,
		});

		expect(result).to.have.property('bar', 2);
		expect(result).to.have.property('$and').that.is.an('array').with.lengthOf(2);

		// First element is the newly added condition
		expect(result.$and[0]).to.deep.equal({
			$or: [{ departmentAncestors: { $in: ['u-a'] } }, { departmentId: { $in: ['dep-a'] } }, { departmentId: { $exists: false } }],
		});
		// Then the existing ones
		expect(result.$and[1]).to.deep.equal({ foo: 1 });

		// Ensure original $and was not mutated by reference insertion (since we recompose it)
		expect(originalQuery.$and).to.deep.equal([{ foo: 1 }]);
	});

	it('handles empty intersections by producing restrictive filters while still allowing rooms without department', async () => {
		const { restrictQuery, findArgs } = loadSut({
			getUnitsFromUserResult: ['unit-x'],
			departmentsToReturn: [], // none will match
			captureFindArgs: true,
		});

		const result = await (restrictQuery as (p: RestrictQueryParams) => Promise<any>)({
			originalQuery: {},
			unitsFilter: ['unit-y'], // intersection => []
		});

		// find called with empty $in arrays
		expect(findArgs).to.have.length(1);
		expect(findArgs[0].query).to.deep.equal({
			$or: [{ ancestors: { $in: [] } }, { _id: { $in: [] } }],
		});

		// Resulting condition must reflect empty unit and department lists,
		// but still allow rooms where departmentId does not exist
		expect(result.$and).to.have.length(1);
		expect(result.$and[0]).to.deep.equal({
			$or: [{ departmentAncestors: { $in: [] } }, { departmentId: { $in: [] } }, { departmentId: { $exists: false } }],
		});
	});

	// New test: Validate the exact parameters passed to LivechatDepartment.find
	it('calls LivechatDepartment.find with correct query and projection parameters', async () => {
		const userUnits = ['unit-10', 'unit-20', 'unit-30'];
		const { restrictQuery, findArgs, findStub } = loadSut({
			getUnitsFromUserResult: userUnits,
			departmentsToReturn: [{ _id: 'dep-10' }],
			captureFindArgs: true,
		});

		const originalQuery = { $and: [{ state: { $ne: 'archived' } }], custom: 'x' };
		const result = await (restrictQuery as (p: RestrictQueryParams) => Promise<any>)({
			originalQuery,
			userId: 'abc',
		});

		// Ensure find has been called exactly once
		expect(findStub.callCount).to.equal(1);
		expect(findArgs).to.have.length(1);

		// Validate query argument
		expect(findArgs[0].query).to.deep.equal({
			$or: [{ ancestors: { $in: userUnits } }, { _id: { $in: userUnits } }],
		});

		// Validate projection argument is exactly as expected
		expect(findArgs[0].projection).to.deep.equal({ projection: { _id: 1 } });

		// And the resulting query contains our original bits
		expect(result).to.have.property('custom', 'x');
		expect(result.$and[1]).to.deep.equal({ state: { $ne: 'archived' } });
	});

	// New test: Ensure departments returned by find are added to the query's departmentId $in clause
	it('uses departments returned by find to build departmentId $in condition', async () => {
		const userUnits = ['unit-a'];
		const departments = [{ _id: 'dep-a' }, { _id: 'dep-b' }, { _id: 'dep-c' }];
		const { restrictQuery } = loadSut({
			getUnitsFromUserResult: userUnits,
			departmentsToReturn: departments,
			captureFindArgs: true,
		});

		const result = await (restrictQuery as (p: RestrictQueryParams) => Promise<any>)({
			originalQuery: { tag: 'vip' },
			userId: 'some-user',
		});

		// Validate that all department ids are present in the $in list
		expect(result).to.have.property('$and');
		expect(result.$and).to.be.an('array').with.lengthOf(1);
		const orCondition = result.$and[0].$or;
		expect(orCondition).to.be.an('array').with.lengthOf(3);

		// Extract the departmentId condition
		const deptIdCond = orCondition.find((c: any) => Object.keys(c)[0] === 'departmentId');
		expect(deptIdCond).to.deep.equal({ departmentId: { $in: ['dep-a', 'dep-b', 'dep-c'] } });
		expect(result.tag).to.equal('vip');
	});
});
