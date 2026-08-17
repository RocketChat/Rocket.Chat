import type { ISetting, SettingValidationRule } from '@rocket.chat/core-typings';
import { isSettingCode } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import { isRecord } from '@rocket.chat/tools';

import { settings } from '../settings';
import { getSettingSchemaValidator } from '../settings/functions/settingSchemas';

const logger = new Logger('SettingValidation');

export class SettingValidationError extends Error {}

const isAppliesWhenCondition = (value: unknown): value is { _id: ISetting['_id']; value: unknown } =>
	isRecord(value) && typeof value._id === 'string' && 'value' in value;

const isValidationRule = (rule: unknown): rule is SettingValidationRule =>
	isRecord(rule) &&
	isRecord(rule.query) &&
	(rule.appliesWhen === undefined ||
		isAppliesWhenCondition(rule.appliesWhen) ||
		(Array.isArray(rule.appliesWhen) && rule.appliesWhen.every(isAppliesWhenCondition)));

const isValidationRuleArray = (value: unknown): value is SettingValidationRule[] => Array.isArray(value) && value.every(isValidationRule);

const parseValidationRules = (settingId: ISetting['_id'], validation: NonNullable<ISetting['validation']>): SettingValidationRule[] => {
	if (typeof validation !== 'string') {
		return validation;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(validation);
	} catch (err) {
		logger.error({ msg: 'Failed to parse setting validation rules', settingId, err });
		return [];
	}

	if (!isValidationRuleArray(parsed)) {
		logger.error({ msg: 'Setting validation rules are not well-formed', settingId });
		return [];
	}

	return parsed;
};

const isSettingReference = (value: unknown): value is { $setting: ISetting['_id'] } =>
	isRecord(value) && typeof value.$setting === 'string';

// an empty value means the setting is unconfigured and always passes
const validatesSchema = (setting: ISetting, value: unknown): boolean => {
	const validate = getSettingSchemaValidator(setting._id);
	if (!validate || !isSettingCode(setting) || setting.code !== 'application/json' || value === '') {
		return true;
	}

	if (typeof value !== 'string') {
		return false;
	}

	try {
		return !!validate(JSON.parse(value));
	} catch {
		return false;
	}
};

/**
 * Evaluates a setting's validation rule against the value being saved. Returns `false` only when the rule's filter
 * rejects the candidate. A rule that references a setting which does not exist is logged and treated as passing, so a
 * broken declaration never blocks a save.
 */
const evaluateSettingValidationRule = (
	settingId: ISetting['_id'],
	rule: SettingValidationRule,
	get: (id: ISetting['_id']) => unknown,
): boolean => {
	const references: Record<string, unknown> = {};

	// true when `filter` matches the current value of the setting `id`
	const matches = (filter: Record<string, unknown>, id: ISetting['_id']): boolean =>
		createPredicateFromFilter<{ _id: ISetting['_id']; value: unknown }>(filter)({ _id: id, value: get(id) });

	// replaces every `{ $setting: '<id>' }` in the filter with that setting's value,
	// recording each in `references`
	const resolveObject = (filter: Record<string, unknown>): Record<string, unknown> =>
		Object.fromEntries(Object.entries(filter).map(([key, value]) => [key, resolveNode(value)]));

	const resolveNode = (node: unknown): unknown => {
		if (isSettingReference(node)) {
			references[node.$setting] = get(node.$setting);
			return references[node.$setting];
		}
		if (Array.isArray(node)) {
			return node.map(resolveNode);
		}
		if (isRecord(node)) {
			return resolveObject(node);
		}
		return node;
	};

	const conditions = [rule.appliesWhen ?? []].flat();
	const query = resolveObject(rule.query);
	for (const condition of conditions) {
		references[condition._id] = get(condition._id);
	}

	const unknownReferences = Object.keys(references).filter((id) => references[id] === undefined);
	if (unknownReferences.length) {
		logger.error({ msg: 'Setting validation rule references unknown settings', settingId, references: unknownReferences });
		return true;
	}

	// the rule only applies while all of its `appliesWhen` conditions hold,
	// otherwise it is not relevant and passes
	const conditionHolds = (condition: { _id: ISetting['_id']; value: unknown }): boolean =>
		matches({ value: condition.value }, condition._id);
	if (!conditions.every(conditionHolds)) {
		return true;
	}

	return matches(query, settingId);
};

export const validateSettingRules = (changes: { _id: ISetting['_id']; value: ISetting['value'] }[]): void => {
	// a value being saved in this batch wins over the stored one,
	// so rules never compare against stale values
	const getValueOf = (id: ISetting['_id']): unknown => {
		const beingSaved = changes.find(({ _id }) => _id === id);
		return beingSaved ? beingSaved.value : settings.get(id);
	};

	for (const { _id, value } of changes) {
		const setting = settings.getSetting(_id);
		if (!setting) {
			continue;
		}

		if (!validatesSchema(setting, value)) {
			throw new SettingValidationError(`${setting._id}_Invalid`);
		}

		if (!setting.validation) {
			continue;
		}

		for (const rule of parseValidationRules(setting._id, setting.validation)) {
			if (evaluateSettingValidationRule(setting._id, rule, getValueOf)) {
				continue;
			}

			throw new SettingValidationError(`${setting._id}_Invalid`);
		}
	}
};
