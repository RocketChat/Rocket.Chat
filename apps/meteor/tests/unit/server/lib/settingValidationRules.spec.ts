import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

import { registerSettingSchema } from '../../../../server/settings/functions/settingSchemas';
import {
	positiveOrDisabled,
	notGreaterThanSetting,
	notLowerThanSetting,
	mustBeDisabledWhileSettingsAreEnabled,
} from '../../../../server/settings/functions/validationRuleBuilders';

const settingsGetMock = sinon.stub();
const settingsGetSettingMock = sinon.stub();
const loggerErrorMock = sinon.stub();

const { validateSettingRules, SettingValidationError } = p.noCallThru().load('../../../../server/lib/settingValidationRules.ts', {
	'@rocket.chat/logger': {
		Logger: class {
			error = loggerErrorMock;
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
		loggerErrorMock.reset();

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

	it('passes a rule referencing a setting that does not exist, and reports the broken declaration', () => {
		settingsGetSettingMock.withArgs('Ref_Setting').returns({
			_id: 'Ref_Setting',
			type: 'int',
			validation: '[{"query":{"value":{"$lte":{"$setting":"Missing_Setting"}}}}]',
		});

		expect(() => validateSettingRules([{ _id: 'Ref_Setting', value: 999 }])).to.not.throw();
		expect(loggerErrorMock.calledOnce).to.be.true;
	});

	it('stays quiet about an absent reference the rule declared it may have', () => {
		settingsGetSettingMock.withArgs('Ref_Setting').returns({
			_id: 'Ref_Setting',
			type: 'int',
			validation: '[{"query":{"value":{"$lte":{"$setting":"Missing_Setting"}}},"referencesMayBeAbsent":true}]',
		});

		expect(() => validateSettingRules([{ _id: 'Ref_Setting', value: 999 }])).to.not.throw();
		expect(loggerErrorMock.called).to.be.false;
	});

	it('rejects a declaration whose referencesMayBeAbsent is not a boolean', () => {
		settingsGetSettingMock.withArgs('Ref_Setting').returns({
			_id: 'Ref_Setting',
			type: 'int',
			validation: '[{"query":{"value":false},"appliesWhen":[{"_id":"Gate","value":true}],"referencesMayBeAbsent":"yes"}]',
		});
		// the gate holds, so a rule that survived the shape check would refuse this save
		settingsGetMock.withArgs('Gate').returns(true);

		expect(() => validateSettingRules([{ _id: 'Ref_Setting', value: true }])).to.not.throw();
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

	describe('a rule gated on more than one setting', () => {
		beforeEach(() => {
			settingsGetSettingMock.withArgs('Discussion_enabled').returns({
				_id: 'Discussion_enabled',
				type: 'boolean',
				validation: JSON.stringify([mustBeDisabledWhileSettingsAreEnabled('ABAC_Enabled', 'ABAC_Enforce_All_Rooms')]),
			});
		});

		const gates = (abacEnabled: unknown, enforceAllRooms: unknown) => {
			settingsGetMock.withArgs('ABAC_Enabled').returns(abacEnabled);
			settingsGetMock.withArgs('ABAC_Enforce_All_Rooms').returns(enforceAllRooms);
		};

		it('refuses the save only while every gate is on', () => {
			gates(true, true);

			expect(() => validateSettingRules([{ _id: 'Discussion_enabled', value: true }])).to.throw('Discussion_enabled_Invalid');
		});

		it('allows the save while one gate is off', () => {
			gates(true, false);
			expect(() => validateSettingRules([{ _id: 'Discussion_enabled', value: true }])).to.not.throw();

			gates(false, true);
			expect(() => validateSettingRules([{ _id: 'Discussion_enabled', value: true }])).to.not.throw();
		});

		it('allows the value the rule holds the setting at', () => {
			gates(true, true);

			expect(() => validateSettingRules([{ _id: 'Discussion_enabled', value: false }])).to.not.throw();
		});

		it('reads a gate turned off in the same batch, not the stored value', () => {
			gates(true, true);

			expect(() =>
				validateSettingRules([
					{ _id: 'ABAC_Enforce_All_Rooms', value: false },
					{ _id: 'Discussion_enabled', value: true },
				]),
			).to.not.throw();
		});

		it('passes in an edition where the gates were never registered, without reporting it', () => {
			gates(undefined, undefined);

			expect(() => validateSettingRules([{ _id: 'Discussion_enabled', value: true }])).to.not.throw();
			expect(loggerErrorMock.called).to.be.false;
		});

		it('skips a persisted rule whose conditions are an empty array rather than applying it always', () => {
			settingsGetSettingMock.withArgs('Discussion_enabled').returns({
				_id: 'Discussion_enabled',
				type: 'boolean',
				validation: '[{"query":{"value":false},"appliesWhen":[]}]',
			});

			expect(() => validateSettingRules([{ _id: 'Discussion_enabled', value: true }])).to.not.throw();
		});
	});

	describe('JSON settings with a schema', () => {
		const schema = {
			type: 'object',
			required: ['version'],
			additionalProperties: false,
			properties: { version: { const: 1 } },
		};

		beforeEach(() => {
			registerSettingSchema('Json_Config', schema);
			settingsGetSettingMock.withArgs('Json_Config').returns({
				_id: 'Json_Config',
				type: 'code',
				code: 'application/json',
			});
		});

		it('accepts a JSON document matching the schema', () => {
			expect(() => validateSettingRules([{ _id: 'Json_Config', value: '{"version":1}' }])).to.not.throw();
		});

		it('rejects a JSON document violating the schema', () => {
			expect(() => validateSettingRules([{ _id: 'Json_Config', value: '{"version":2}' }])).to.throw('Json_Config_Invalid');
		});

		it('rejects a value that is not parseable JSON', () => {
			expect(() => validateSettingRules([{ _id: 'Json_Config', value: 'not json {' }])).to.throw('Json_Config_Invalid');
		});

		it('accepts an empty value, meaning the setting is unconfigured', () => {
			expect(() => validateSettingRules([{ _id: 'Json_Config', value: '' }])).to.not.throw();
		});

		it('ignores a schema registered for a code setting that is not application/json', () => {
			registerSettingSchema('Js_Code', schema);
			settingsGetSettingMock.withArgs('Js_Code').returns({
				_id: 'Js_Code',
				type: 'code',
				code: 'text/javascript',
			});

			expect(() => validateSettingRules([{ _id: 'Js_Code', value: 'not json {' }])).to.not.throw();
		});
	});
});
