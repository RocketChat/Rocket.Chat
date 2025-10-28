import { settingsRegistry } from '../../app/settings/server';

export const createAssetsSettings = () =>
	settingsRegistry.addGroup('Assets', async function () {
		await this.add('Assets_SvgFavicon_Enable', true, {
			type: 'boolean',
			group: 'Assets',
			i18nLabel: 'Enable_Svg_Favicon',
		});
	});
