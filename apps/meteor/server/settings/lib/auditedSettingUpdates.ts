import type {
	IAuditServerAppActor,
	IAuditServerSystemActor,
	IAuditServerUserActor,
	ISetting,
	SettingValue,
} from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server/cached';

const shouldMaskSettingInAudit = (settingId: ISetting['_id']): boolean => {
	const setting = settings.getSetting(settingId);
	return Boolean(setting && (setting.type === 'password' || setting.secret === true));
};

const maskIfNeeded = (settingId: ISetting['_id'], value: SettingValue): SettingValue => {
	if (!shouldMaskSettingInAudit(settingId)) {
		return value;
	}

	if (value === undefined || value === null || value === '') {
		return value;
	}

	const valueString = String(value);
	const valueLength = valueString.length;

	let maskedValue: string;

	if (valueLength <= 3) {
		maskedValue = '*'.repeat(valueLength);
	} else {
		const visiblePart = valueString.substring(0, 3);
		const maskedPart = '*'.repeat(valueLength - 3);
		maskedValue = visiblePart + maskedPart;
	}

	return maskedValue;
};

export const resetAuditedSettingByUser =
	(actor: Omit<IAuditServerUserActor, 'type'>) =>
	<F extends (key: ISetting['_id']) => any>(fn: F, key: ISetting['_id']): ReturnType<F> => {
		const { value, packageValue } = settings.getSetting(key) ?? {};

		void ServerEvents.createAuditServerEvent(
			'settings.changed',
			{
				id: key,
				previous: maskIfNeeded(key, value),
				current: maskIfNeeded(key, packageValue),
			},
			{
				type: 'user',
				...actor,
			},
		);
		return fn(key);
	};

export const updateAuditedByUser =
	(actor: Omit<IAuditServerUserActor, 'type'>) =>
	<K extends ISetting['_id'], T extends ISetting['value'], F extends (_id: K, value: T, ...args: any[]) => any>(
		fn: F,
		...args: Parameters<F>
	): ReturnType<F> => {
		const [key, value, ...rest] = args;
		const setting = settings.getSetting(key);

		const previous = setting?.value;

		void ServerEvents.createAuditServerEvent(
			'settings.changed',
			{
				id: key,
				previous: maskIfNeeded(key, previous),
				current: maskIfNeeded(key, value),
			},
			{
				type: 'user',
				...actor,
			},
		);
		return fn(key, value, ...rest);
	};

export const updateAuditedBySystem =
	(actor: Omit<IAuditServerSystemActor, 'type'>) =>
	<T extends ISetting['value'], F extends (_id: ISetting['_id'], value: T, ...args: any[]) => any>(
		fn: F,
		...args: Parameters<F>
	): ReturnType<F> => {
		const [key, value, ...rest] = args;
		const setting = settings.getSetting(key);

		const previous = setting?.value;

		void ServerEvents.createAuditServerEvent(
			'settings.changed',
			{
				id: key,
				previous: maskIfNeeded(key, previous),
				current: maskIfNeeded(key, value),
			},
			{
				type: 'system',
				...actor,
			},
		);
		return fn(key, value, ...rest);
	};

export const updateAuditedByApp =
	<T extends ISetting['value'], F extends (_id: ISetting['_id'], value: T, ...args: any[]) => any>(
		actor: Omit<IAuditServerAppActor, 'type'>,
	) =>
	(fn: F, ...args: Parameters<F>): ReturnType<F> => {
		const [key, value, ...rest] = args;
		const setting = settings.getSetting(key);

		const previous = setting?.value;
		void ServerEvents.createAuditServerEvent(
			'settings.changed',
			{
				id: key,
				previous: maskIfNeeded(key, previous),
				current: maskIfNeeded(key, value),
			},
			{
				type: 'app',
				...actor,
			},
		);
		return fn(key, value, ...rest);
	};
