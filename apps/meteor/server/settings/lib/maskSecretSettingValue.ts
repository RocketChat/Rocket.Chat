type MaskableSettingFields = {
	secret?: boolean;
	type: string;
	value?: unknown;
	hasValue?: boolean;
	processEnvValue?: unknown;
	meteorSettingsValue?: unknown;
	valueSource?: unknown;
};

/** Whether a setting holds secret data and should be masked on read / guarded on write. */
export function isSecretSetting(setting: { secret?: boolean; type: string }): boolean {
	return setting.secret === true || setting.type === 'password';
}

/**
 * Returns true when a write should be skipped because the submitted value is
 * the empty-string masked sentinel and the setting already has a real value.
 */
export function shouldSkipSecretWrite(setting: { secret?: boolean; type: string; value?: unknown }, newValue: unknown): boolean {
	return isSecretSetting(setting) && newValue === '' && Boolean(setting.value);
}

export function maskSecretSettingValue<T extends MaskableSettingFields>(setting: T): T & { hasValue?: boolean } {
	if (isSecretSetting(setting)) {
		return {
			...setting,
			value: '',
			hasValue: Boolean(setting.value),
			// Suppress all fields that could be used to recover or infer the secret value
			processEnvValue: undefined,
			meteorSettingsValue: undefined,
			valueSource: undefined,
		};
	}
	return setting;
}
