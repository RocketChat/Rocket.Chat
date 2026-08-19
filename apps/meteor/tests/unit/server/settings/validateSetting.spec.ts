import type { ISetting } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

import { SettingValidationError } from '../../../../server/lib/settingValidationRules';
import { positiveOrDisabled, notGreaterThanSetting, notLowerThanSetting } from '../../../../server/settings/functions/validationRuleBuilders';

const settingsGetMock = sinon.stub();
const settingsGetSettingMock = sinon.stub();

class MeteorError extends Error {
	constructor(
		public error: string,
		public reason?: string,
		public details?: any,
	) {
		super(reason || error);
		this.name = 'MeteorError';
	}
}

const { validateSetting, validateSettings } = p.noCallThru().load('../../../../server/settings/validateSetting.ts', {
	'meteor/meteor': {
		Meteor: {
			Error: MeteorError,
		},
	},
	'./checkSettingValueBonds': {
		checkSettingValueBounds: (setting: ISetting, value?: ISetting['value']) => {
			if ((setting.type === 'int' || setting.type === 'range') && value !== undefined) {
				if (setting.minValue !== undefined && Number(value) < setting.minValue) {
					throw new MeteorError(
						'error-invalid-setting-value',
						`Value for setting ${setting._id} must be greater than or equal to ${setting.minValue}`,
						{ method: 'saveSettings' },
					);
				}
				if (setting.maxValue !== undefined && Number(value) > setting.maxValue) {
					throw new MeteorError(
						'error-invalid-setting-value',
						`Value for setting ${setting._id} must be less than or equal to ${setting.maxValue}`,
						{ method: 'saveSettings' },
					);
				}
			}
		},
	},
	'.': {
		settings: {
			get: settingsGetMock,
			getSetting: settingsGetSettingMock,
		},
	},
	'../lib/settingValidationRules': {
		SettingValidationError,
		validateSettingRules: (changes: { _id: ISetting['_id']; value: ISetting['value'] }[]) => {
			const getValueOf = (id: ISetting['_id']): unknown => {
				const beingSaved = changes.find(({ _id }) => _id === id);
				return beingSaved ? beingSaved.value : settingsGetMock(id);
			};

			for (const { _id, value } of changes) {
				const setting = settingsGetSettingMock(_id);
				if (!setting) {
					continue;
				}

				if (setting.validation) {
					const rules = JSON.parse(setting.validation);
					if (_id === 'Accounts_Password_Policy_MinLength' && typeof value === 'number') {
						const max = getValueOf('Accounts_Password_Policy_MaxLength');
						if (typeof max === 'number' && max !== -1 && value > max) {
							throw new SettingValidationError(`${_id}_Invalid`, _id, 'rule');
						}
					}
				}
			}
		},
	},
});

const validationBySettingId: Record<string, unknown> = {
	Accounts_Password_Policy_MinLength: [positiveOrDisabled(), notGreaterThanSetting('Accounts_Password_Policy_MaxLength')],
	Accounts_Password_Policy_MaxLength: [positiveOrDisabled(), notLowerThanSetting('Accounts_Password_Policy_MinLength')],
};

describe('validateSetting & validateSettings domain validator', () => {
	beforeEach(() => {
		settingsGetMock.reset();
		settingsGetSettingMock.reset();

		settingsGetSettingMock.callsFake((_id: string) => {
			if (_id === 'Bounded_Setting') {
				return {
					_id: 'Bounded_Setting',
					type: 'int',
					minValue: 5,
					maxValue: 10,
				};
			}

			return {
				_id,
				type: 'int',
				...(validationBySettingId[_id] ? { validation: JSON.stringify(validationBySettingId[_id]) } : {}),
			};
		});
	});

	it('should throw SettingValidationError with reason "bounds" and settingId when value is below minValue', () => {
		const setting: ISetting = {
			_id: 'Bounded_Setting',
			type: 'int',
			minValue: 5,
			maxValue: 10,
			value: 2,
			packageValue: 5,
			blocked: false,
			hidden: false,
			sorter: 1,
			i18nLabel: 'Bounded_Setting',
		};

		let thrownError: any;
		try {
			validateSetting(setting, 2);
		} catch (err) {
			thrownError = err;
		}

		expect(thrownError).to.be.instanceOf(SettingValidationError);
		expect(thrownError.settingId).to.equal('Bounded_Setting');
		expect(thrownError.reason).to.equal('bounds');
	});

	it('should throw SettingValidationError with reason "bounds" when value is above maxValue', () => {
		const setting: ISetting = {
			_id: 'Bounded_Setting',
			type: 'int',
			minValue: 5,
			maxValue: 10,
			value: 15,
			packageValue: 5,
			blocked: false,
			hidden: false,
			sorter: 1,
			i18nLabel: 'Bounded_Setting',
		};

		let thrownError: any;
		try {
			validateSetting(setting, 15);
		} catch (err) {
			thrownError = err;
		}

		expect(thrownError).to.be.instanceOf(SettingValidationError);
		expect(thrownError.settingId).to.equal('Bounded_Setting');
		expect(thrownError.reason).to.equal('bounds');
	});

	it('should throw SettingValidationError with reason "rule" when declarative rules fail', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MaxLength').returns(10);

		let thrownError: any;
		try {
			validateSettings([{ _id: 'Accounts_Password_Policy_MinLength', value: 15 }]);
		} catch (err) {
			thrownError = err;
		}

		expect(thrownError).to.be.instanceOf(SettingValidationError);
		expect(thrownError.settingId).to.equal('Accounts_Password_Policy_MinLength');
		expect(thrownError.reason).to.equal('rule');
	});

	it('should pass validation when bounds and rules are satisfied', () => {
		const setting: ISetting = {
			_id: 'Bounded_Setting',
			type: 'int',
			minValue: 5,
			maxValue: 10,
			value: 7,
			packageValue: 5,
			blocked: false,
			hidden: false,
			sorter: 1,
			i18nLabel: 'Bounded_Setting',
		};

		expect(() => validateSetting(setting, 7)).to.not.throw();
	});

	it('should preserve multi-setting batch context during validateSettings', () => {
		settingsGetMock.withArgs('Accounts_Password_Policy_MaxLength').returns(5);

		expect(() =>
			validateSettings([
				{ _id: 'Accounts_Password_Policy_MinLength', value: 8 },
				{ _id: 'Accounts_Password_Policy_MaxLength', value: 20 },
			]),
		).to.not.throw();
	});
});
