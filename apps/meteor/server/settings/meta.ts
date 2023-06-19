import { settingsRegistry } from '../../app/settings/server';

export const createMetaSettings = () =>
	settingsRegistry.addGroup('Meta', async function () {
		await this.add('Meta_language', '', {
			type: 'string',
		});
		await this.add('Meta_fb_app_id', '', {
			type: 'string',
			secret: true,
		});
		await this.add('Meta_robots', 'INDEX,FOLLOW', {
			type: 'string',
		});
		await this.add('Meta_google-site-verification', '', {
			type: 'string',
			secret: true,
		});
		await this.add('Meta_msvalidate01', '', {
			type: 'string',
			secret: true,
		});
		return this.add('Meta_custom', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
		});
	});
