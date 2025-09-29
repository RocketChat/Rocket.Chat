import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): void {
	void settingsRegistry.addGroup('ABAC', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['abac'],
			},
			async function () {
				await this.add('ABAC_Enabled', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
				});
			},
		);
	});
}
