import type { BaseTest } from './test';

export type SettingsFixture = {
	get<T>(key: string): Promise<T>;
	set<T>(key: string, value: T): Promise<void>;
};

export async function settings({ api }: BaseTest, _use: (r: SettingsFixture) => Promise<void>) {
	const settingsToReset: Map<string, unknown> = new Map();
	const get = async <T>(id: string): Promise<T> => {
		const response = await api.get(`/settings/${id}`);
		if (!response.ok()) {
			throw new Error(`Could not get setting ${id}`);
		}
		const { value } = await response.json();
		return value;
	};
	const set = async <T>(id: string, value: T): Promise<void> => {
		if (!settingsToReset.has(id)) {
			const originalValue = await get<T>(id);
			settingsToReset.set(id, originalValue);
		}
		const response = await api.post(`/settings/${id}`, { value });
		if (!response.ok()) {
			throw new Error(`Could not set setting ${id} to value ${value}`);
		}
	};
	await _use({ get, set });
	await Promise.all(
		Array.from(settingsToReset.entries()).map(async ([id, value]) => {
			const response = await api.post(`/settings/${id}`, { value });
			if (!response.ok()) {
				throw new Error(`Could not reset setting ${id} to value ${value}`);
			}
		}),
	);
}
