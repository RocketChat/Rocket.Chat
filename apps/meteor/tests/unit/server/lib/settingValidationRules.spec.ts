import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

import {
	positiveOrDisabled,
	notGreaterThanSetting,
	notLowerThanSetting,
} from '../../../../server/settings/functions/validationRuleBuilders';

const settingsGetMock = sinon.stub();
const settingsGetSettingMock = sinon.stub();

const { validateSettingRules, SettingValidationError } = p.noCallThru().load('../../../../server/lib/settingValidationRules.ts', {
	'@rocket.chat/logger': {
		Logger: class {
			error = (): undefined => undefined;
		},
	},
	'../settings': { settings: { get: settingsGetMock, getSetting: settingsGetSettingMock } },
});

const validationBySettingId: Record<string, unknown> = {
	Accounts_Password_Policy_MinLength: [positiveOrDisabled(), notGreaterThanSetting('Accounts_Password_Policy_MaxLength')],
	Accounts_Password_Policy_MaxLength: [positiveOrDisabled(), notLowerThanSetting('Accounts_Password_Policy_MinLength')],
};

describe('validateSettingRules', () => {
	beforeEach(() => {
		settingsGetMock.reset();
		settingsGetSettingMock.reset();

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
			'Accounts_Password_Policy_MaxLength_Invalid',
		);
		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MinLength', value: -5 }])).to.throw(
			'Accounts_Password_Policy_MinLength_Invalid',
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

	it('passes a rule referencing a setting that does not exist', () => {
		settingsGetSettingMock.withArgs('Ref_Setting').returns({
			_id: 'Ref_Setting',
			type: 'int',
			validation: '[{"query":{"value":{"$lte":{"$setting":"Missing_Setting"}}}}]',
		});

		expect(() => validateSettingRules([{ _id: 'Ref_Setting', value: 999 }])).to.not.throw();
	});

	it('skips malformed persisted rules instead of crashing the save', () => {
		const malformed = [
			'[{"query":null}]',
			'[{"query":{"value":{"$gte":1}},"appliesWhen":"junk"}]',
			'[{"query":{"value":{"$gte":1}},"appliesWhen":{"_id":"Gate"}}]',
		];

		for (const validation of malformed) {
			settingsGetSettingMock.withArgs('Malformed_Setting').returns({ _id: 'Malformed_Setting', type: 'int', validation });

			expect(() => validateSettingRules([{ _id: 'Malformed_Setting', value: 0 }]), validation).to.not.throw();
		}
	});

	it('does not enforce the value type, leaving those checks to each save path', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MaxLength').returns(10);

		expect(() => validateSettingRules([{ _id: 'Accounts_Password_Policy_MinLength', value: 5.5 }])).to.not.throw();
	});
});
