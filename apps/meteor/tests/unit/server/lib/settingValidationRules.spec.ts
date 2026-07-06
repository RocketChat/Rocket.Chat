import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const systemLoggerErrorMock = sinon.stub();
const settingsGetMock = sinon.stub();
const settingsGetSettingMock = sinon.stub();

// createPredicateFromFilter (@rocket.chat/mongo-adapter) and isRecord (@rocket.chat/tools) are pure — left un-stubbed
const { evaluateSettingValidationRule, validateSettingRules } = p
	.noCallThru()
	.load('../../../../server/lib/settingValidationRules.ts', {
		'./logger/system': { SystemLogger: { error: systemLoggerErrorMock } },
		'../settings': { settings: { get: settingsGetMock, getSetting: settingsGetSettingMock } },
	});

const getterFor =
	(values: Record<string, unknown>) =>
	(id: string): unknown =>
		values[id];

describe('evaluateSettingValidationRule', () => {
	beforeEach(() => {
		systemLoggerErrorMock.reset();
	});

	it('returns true when the filter matches the setting value', () => {
		const rule = { query: { value: { $gte: 1 } }, errorKey: 'error' };

		expect(evaluateSettingValidationRule('Some_Setting', rule, getterFor({ Some_Setting: 5 }))).to.be.true;
	});

	it('returns false when the filter rejects the setting value', () => {
		const rule = { query: { value: { $gte: 1 } }, errorKey: 'error' };

		expect(evaluateSettingValidationRule('Some_Setting', rule, getterFor({ Some_Setting: 0 }))).to.be.false;
	});

	it('resolves a `$setting` reference to another setting current value', () => {
		const rule = { query: { value: { $gte: { $setting: 'Other_Setting' } } }, errorKey: 'error' };

		expect(evaluateSettingValidationRule('Some_Setting', rule, getterFor({ Some_Setting: 10, Other_Setting: 6 }))).to.be.true;
		expect(evaluateSettingValidationRule('Some_Setting', rule, getterFor({ Some_Setting: 4, Other_Setting: 6 }))).to.be.false;
	});

	it('skips the rule (returns true) when an appliesWhen condition does not hold', () => {
		const rule = { query: { value: { $gte: 1 } }, appliesWhen: { _id: 'Gate', value: true }, errorKey: 'error' };

		// value 0 would fail the query, but the gate is off, so the rule is not relevant
		expect(evaluateSettingValidationRule('Some_Setting', rule, getterFor({ Some_Setting: 0, Gate: false }))).to.be.true;
	});

	it('evaluates the rule when its appliesWhen condition holds', () => {
		const rule = { query: { value: { $gte: 1 } }, appliesWhen: { _id: 'Gate', value: true }, errorKey: 'error' };

		expect(evaluateSettingValidationRule('Some_Setting', rule, getterFor({ Some_Setting: 0, Gate: true }))).to.be.false;
	});

	it('supports an array of appliesWhen conditions, requiring all to hold', () => {
		const rule = {
			query: { value: { $gte: 1 } },
			appliesWhen: [
				{ _id: 'A', value: true },
				{ _id: 'B', value: true },
			],
			errorKey: 'error',
		};

		// one gate off → rule skipped → passes, even though the value would fail the query
		expect(evaluateSettingValidationRule('Some_Setting', rule, getterFor({ Some_Setting: 0, A: true, B: false }))).to.be.true;
		// both gates on → rule evaluated → fails
		expect(evaluateSettingValidationRule('Some_Setting', rule, getterFor({ Some_Setting: 0, A: true, B: true }))).to.be.false;
	});

	it('logs and passes when the rule references a setting that does not exist', () => {
		const rule = { query: { value: { $gte: { $setting: 'Missing_Setting' } } }, errorKey: 'error' };

		expect(evaluateSettingValidationRule('Some_Setting', rule, getterFor({ Some_Setting: 5 }))).to.be.true;
		expect(systemLoggerErrorMock.calledOnce).to.be.true;
		expect(systemLoggerErrorMock.firstCall.firstArg.references).to.deep.equal(['Missing_Setting']);
	});
});

// mirrors the declarations on server/settings/accounts.ts
const validationBySettingId: Record<string, unknown> = {
	Accounts_Password_Policy_MinLength: [
		{
			query: { $or: [{ value: -1 }, { value: { $gte: 1 } }] },
			errorKey: 'Accounts_Password_Policy_MinLength_Invalid_Value',
		},
		{
			query: { $or: [{ value: { $lt: 1 } }, { value: { $lte: { $setting: 'Accounts_Password_Policy_MaxLength' } } }] },
			appliesWhen: { _id: 'Accounts_Password_Policy_MaxLength', value: { $gte: 1 } },
			errorKey: 'Accounts_Password_Policy_MinLength_Invalid',
		},
	],
	Accounts_Password_Policy_MaxLength: [
		{
			query: { $or: [{ value: -1 }, { value: { $gte: 1 } }] },
			errorKey: 'Accounts_Password_Policy_MaxLength_Invalid_Value',
		},
		{
			query: { $or: [{ value: { $lt: 1 } }, { value: { $gte: { $setting: 'Accounts_Password_Policy_MinLength' } } }] },
			errorKey: 'Accounts_Password_Policy_MaxLength_Invalid',
		},
	],
};

describe('validateSettingRules', () => {
	beforeEach(() => {
		settingsGetMock.reset();
		settingsGetSettingMock.reset();
		systemLoggerErrorMock.reset();

		settingsGetSettingMock.callsFake((_id: string) => ({
			_id,
			type: 'int',
			...(validationBySettingId[_id] ? { validation: JSON.stringify(validationBySettingId[_id]) } : {}),
		}));
	});

	it('rejects when a declared validation rule fails within the batch', () => {
		expect(() =>
			validateSettingRules([
				{ _id: 'Accounts_Password_Policy_MinLength', value: 6 },
				{ _id: 'Accounts_Password_Policy_MaxLength', value: 4 },
			]),
		).to.throw('Accounts_Password_Policy_MinLength_Invalid');
	});

	it('throws an error whose message is the i18n key of the failed rule', () => {
		const error = (() => {
			try {
				validateSettingRules([
					{ _id: 'Accounts_Password_Policy_MinLength', value: 6 },
					{ _id: 'Accounts_Password_Policy_MaxLength', value: 4 },
				]);
			} catch (thrown) {
				return thrown as Error;
			}
		})();

		expect(error).to.be.instanceOf(Error);
		expect(error?.message).to.equal('Accounts_Password_Policy_MinLength_Invalid');
	});

	it('resolves values batch-first, not from the stale cached value', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MinLength').returns(14);

		// cached min is 14, but the batch lowers it to 6 — max 10 must be accepted
		expect(() =>
			validateSettingRules([
				{ _id: 'Accounts_Password_Policy_MinLength', value: 6 },
				{ _id: 'Accounts_Password_Policy_MaxLength', value: 10 },
			]),
		).to.not.throw();
	});

	it('rejects raising the minimum above the stored maximum, with the minimum-side message', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MaxLength').returns(10);

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MinLength', value: 12 }])).to.throw(
			'Accounts_Password_Policy_MinLength_Invalid',
		);
	});

	it('rejects lowering the maximum below the stored minimum, with the maximum-side message', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MinLength').returns(6);

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MaxLength', value: 4 }])).to.throw(
			'Accounts_Password_Policy_MaxLength_Invalid',
		);
	});

	it('accepts a minimum when the maximum is disabled', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MaxLength').returns(-1);

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MinLength', value: 20 }])).to.not.throw();
	});

	it('accepts a maximum when the minimum is disabled', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MinLength').returns(-1);

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MaxLength', value: 5 }])).to.not.throw();
	});

	it('accepts exactly -1 as a disabled bound, regardless of the minimum', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MinLength').returns(6);

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MaxLength', value: -1 }])).to.not.throw();
	});

	it('rejects bound values below 1 that are not exactly -1', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MinLength').returns(6);

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MaxLength', value: 0 }])).to.throw(
			'Accounts_Password_Policy_MaxLength_Invalid_Value',
		);
		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MinLength', value: -5 }])).to.throw(
			'Accounts_Password_Policy_MinLength_Invalid_Value',
		);
	});

	it('validates the pair even when the same batch disables the policy', () => {
		expect(() =>
			validateSettingRules([
				{ _id: 'Accounts_Password_Policy_Enabled', value: false },
				{ _id: 'Accounts_Password_Policy_MinLength', value: 6 },
				{ _id: 'Accounts_Password_Policy_MaxLength', value: 4 },
			]),
		).to.throw('Accounts_Password_Policy_MinLength_Invalid');
	});

	it('does not evaluate rules of settings that are not in the batch', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MinLength').returns(6);
		settingsGetMock.withArgs('Accounts_Password_Policy_MaxLength').returns(4);

		expect(() => validateSettingRules([{ _id: 'Some_Unrelated_Setting', value: 10 }])).to.not.throw();
	});

	it('does not enforce the value type, leaving those checks to each save path', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MaxLength').returns(10);

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MinLength', value: 5.5 }])).to.not.throw();
	});

	it('passes and logs when the persisted validation is malformed JSON', () => {
		settingsGetSettingMock.withArgs('Accounts_Password_Policy_MinLength').returns({
			_id: 'Accounts_Password_Policy_MinLength',
			type: 'int',
			validation: '{ not valid json',
		});

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MinLength', value: 0 }])).to.not.throw();
		expect(systemLoggerErrorMock.calledOnce).to.be.true;
	});

	it('passes and logs when the persisted validation is valid JSON but not a rule array', () => {
		settingsGetSettingMock.withArgs('Accounts_Password_Policy_MinLength').returns({
			_id: 'Accounts_Password_Policy_MinLength',
			type: 'int',
			validation: JSON.stringify({ nope: true }),
		});

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MinLength', value: 0 }])).to.not.throw();
		expect(systemLoggerErrorMock.calledOnce).to.be.true;
	});
});
