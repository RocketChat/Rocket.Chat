import type { IAuditServerAppActor, IAuditServerSystemActor, IAuditServerUserActor, ISetting } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server/cached';

export const resetAuditedSettingByUser =
	<F extends (key: ISetting['_id']) => any>(actor: Omit<IAuditServerUserActor, 'type'>) =>
	(fn: F, key: ISetting['_id']) => {
		const { value, packageValue } = settings.getSetting(key) ?? {};

		void ServerEvents.createAuditServerEvent(
			'settings.changed',
			{
				id: key,
				previous: value,
				current: packageValue,
			},
			{
				type: 'user',
				...actor,
			},
		);
		return fn(key);
	};

export const updateAuditedByUser =
	<T extends ISetting['value'], F extends (_id: ISetting['_id'], value: T, ...args: any[]) => any>(
		actor: Omit<IAuditServerUserActor, 'type'>,
	) =>
	(fn: F, ...args: Parameters<F>) => {
		const [key, value, ...rest] = args;
		const setting = settings.getSetting(key);

		const previous = setting?.value;

		void ServerEvents.createAuditServerEvent(
			'settings.changed',
			{
				id: key,
				previous,
				current: value,
			},
			{
				type: 'user',
				...actor,
			},
		);
		return fn(key, value, ...rest);
	};

export const updateAuditedBySystem =
	<T extends ISetting['value'], F extends (_id: ISetting['_id'], value: T, ...args: any[]) => any>(
		actor: Omit<IAuditServerSystemActor, 'type'>,
	) =>
	(fn: F, ...args: Parameters<F>) => {
		const [key, value, ...rest] = args;
		const setting = settings.getSetting(key);

		const previous = setting?.value;

		void ServerEvents.createAuditServerEvent(
			'settings.changed',
			{
				id: key,
				previous,
				current: value,
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
	(fn: F, ...args: Parameters<F>) => {
		const [key, value, ...rest] = args;
		const setting = settings.getSetting(key);

		const previous = setting?.value;
		void ServerEvents.createAuditServerEvent(
			'settings.changed',
			{
				id: key,
				previous,
				current: value,
			},
			{
				type: 'app',
				...actor,
			},
		);
		return fn(key, value, ...rest);
	};
