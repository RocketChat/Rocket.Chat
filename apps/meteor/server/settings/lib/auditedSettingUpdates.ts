import type { IAuditServerAppActor, IAuditServerSystemActor, IAuditServerUserActor, ISetting } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server/cached';

export const resetAuditedSettingByUser =
	(actor: Omit<IAuditServerUserActor, 'type'>) =>
	<F extends (key: ISetting['_id']) => any>(fn: F, key: ISetting['_id']): ReturnType<F> => {
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
	(fn: F, ...args: Parameters<F>): ReturnType<F> => {
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
