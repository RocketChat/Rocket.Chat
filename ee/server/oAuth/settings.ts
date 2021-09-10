import { onLicense } from '../../app/license/server';
import { settings } from '../../../app/settings/server/functions/settings';

export function addEnterpriseOAuthSettings(name: string, values: any): void {
	console.log('add enterprise o auth settings');
	onLicense('oAuth-enterprise', () => {
		console.log('license activated (:');
		settings.add(`Accounts_OAuth_Custom-${ name }-map_channels`, values.mapChannels || false, { type: 'boolean', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Map_Channels', enterprise: true, invalidValue: false });
	});
}
