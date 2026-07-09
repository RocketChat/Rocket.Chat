import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

import { integerBoundOrDisabled, notAboveSetting, notBelowSetting } from '../../../../server/settings/lib/validationRuleBuilders';

const systemLoggerErrorMock = sinon.stub();
const settingsGetMock = sinon.stub();
const settingsGetSettingMock = sinon.stub();

// createPredicateFromFilter (@rocket.chat/mongo-adapter) and isRecord (@rocket.chat/tools) are pure — left un-stubbed
const { validateSettingRules, SettingValidationError } = p
	.noCallThru()
	.load('../../../../server/lib/settingValidationRules.ts', {
		'./logger/system': { SystemLogger: { error: systemLoggerErrorMock } },
		'../settings': { settings: { get: settingsGetMock, getSetting: settingsGetSettingMock } },
	});

const validationBySettingId: Record<string, unknown> = {
	Accounts_Password_Policy_MinLength: [
		integerBoundOrDisabled('Accounts_Password_Policy_MinLength_Invalid_Value'),
		notAboveSetting('Accounts_Password_Policy_MaxLength', 'Accounts_Password_Policy_MinLength_Invalid'),
	],
	Accounts_Password_Policy_MaxLength: [
		integerBoundOrDisabled('Accounts_Password_Policy_MaxLength_Invalid_Value'),
		notBelowSetting('Accounts_Password_Policy_MinLength', 'Accounts_Password_Policy_MaxLength_Invalid'),
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

	it('rejects an incoherent batch with the failed rule i18n key as the error message', () => {
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

		expect(error).to.be.instanceOf(SettingValidationError);
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

	it('treats exactly -1 as a disabled bound, on either side', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MaxLength').returns(-1);
		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MinLength', value: 20 }])).to.not.throw();

		settingsGetMock.withArgs('Accounts_Password_Policy_MinLength').returns(-1);
		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MaxLength', value: 5 }])).to.not.throw();

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

	it('logs and passes a rule referencing a setting that does not exist', () => {
		settingsGetSettingMock.withArgs('Ref_Setting').returns({
			_id: 'Ref_Setting',
			type: 'int',
			validation: '[{"query":{"value":{"$lte":{"$setting":"Missing_Setting"}}},"errorKey":"error"}]',
		});

		expect(() => validateSettingRules([{ _id: 'Ref_Setting', value: 999 }])).to.not.throw();
		expect(systemLoggerErrorMock.calledOnce).to.be.true;
	});

	it('skips malformed persisted rules, logging instead of crashing or throwing garbage', () => {
		const malformed = [
			'[{"query":null,"errorKey":"error"}]',
			'[{"query":{"value":{"$gte":1}},"errorKey":{}}]',
			'[{"query":{"value":{"$gte":1}},"errorKey":"error","appliesWhen":"junk"}]',
			'[{"query":{"value":{"$gte":1}},"errorKey":"error","appliesWhen":{"_id":"Gate"}}]',
		];

		for (const validation of malformed) {
			systemLoggerErrorMock.reset();
			settingsGetSettingMock.withArgs('Malformed_Setting').returns({ _id: 'Malformed_Setting', type: 'int', validation });

			expect(() => validateSettingRules([{ _id: 'Malformed_Setting', value: 0 }]), validation).to.not.throw();
			expect(systemLoggerErrorMock.calledOnce, validation).to.be.true;
		}
	});

	it('does not enforce the value type, leaving those checks to each save path', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MaxLength').returns(10);

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MinLength', value: 5.5 }])).to.not.throw();
	});
});
