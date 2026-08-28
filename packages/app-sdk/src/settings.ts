/**
 * App settings.
 *
 * Legacy `ISettingsExtend.provideSetting({ id, type, packageValue, ... })` yields
 * settings whose values are read back untyped:
 * `read.getEnvironmentReader().getSettings().getValueById(id)` returns `any`.
 *
 * The SDK declares settings as a keyed map with a schema per entry. The map's
 * *type* is what makes `ctx.settings.get('maxItems')` return `number`. The value
 * map is threaded into the app env by `createApp(...)` so every handler in the
 * app sees typed settings.
 */

import type { Infer, Schema } from './schema';

export type SettingType =
	| 'boolean'
	| 'string'
	| 'number'
	| 'select'
	| 'multiSelect'
	| 'password'
	| 'code'
	| 'color'
	| 'roomPick';

export interface SettingDef<T> {
	type: SettingType;
	/** Schema for the value; also the source of the setting's static type. */
	schema: Schema<T>;
	required?: boolean;
	/** Whether the value is exposed to unauthenticated clients. */
	public?: boolean;
	hidden?: boolean;
	multiline?: boolean;
	section?: string;
	i18nLabel: string;
	i18nDescription?: string;
	i18nPlaceholder?: string;
	/** Options for `select` / `multiSelect`. */
	values?: { key: string; i18nLabel: string }[];
}

export type SettingsMap = Record<string, SettingDef<any>>;

export const SETTINGS = Symbol.for('rc.app-sdk.settings');

export type SettingsDefinition<M extends SettingsMap> = {
	readonly [SETTINGS]: true;
	readonly map: M;
};

/** The value-map type inferred from a settings definition. */
export type InferSettings<D> = D extends SettingsDefinition<infer M>
	? { [K in keyof M]: M[K] extends { schema: infer Sc } ? Infer<Sc> : never }
	: Record<string, never>;

export function defineSettings<const M extends SettingsMap>(map: M): SettingsDefinition<M> {
	return { [SETTINGS]: true, map };
}

export type { Infer };
