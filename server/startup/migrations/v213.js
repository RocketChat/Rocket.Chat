import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';
import { settings } from '../../../app/settings';

Migrations.add({
	version: 213,
	up() {
		Settings.find({
			_id: /Accounts_OAuth_Custom-/,
			i18nLabel: 'Accounts_OAuth_Custom_Enable',
		}).forEach(function(customOauth) {
			const [, name] = /^Accounts_OAuth_Custom-(.*?)$/.exec(customOauth._id);
			const mapCustomFieldsId = `Accounts_OAuth_Custom-${ name }-map_custom_fields`;
			if (!Settings.findOne({ _id: mapCustomFieldsId })) {
				settings.add(mapCustomFieldsId, false, {
					type: 'boolean',
					group: 'OAuth',
					section: `Custom OAuth: ${ name }`,
					i18nLabel: 'Accounts_OAuth_Custom_Map_Custom_Fields',
					persistent: true,
					sorter: Settings.findOne({ _id: `Accounts_OAuth_Custom-${ name }-map_channels` }).sorter,
				});
			}
			const customFieldsMap = `Accounts_OAuth_Custom-${ name }-custom_fields_map`;
			if (!Settings.findOne({ _id: customFieldsMap })) {
				settings.add(customFieldsMap, '{}', {
					type: 'code',
					multiline: true,
					code: 'application/json',
					group: 'OAuth',
					section: `Custom OAuth: ${ name }`,
					i18nLabel: 'Accounts_OAuth_Custom_Custom_Fields_Map',
					i18nDescription: 'Accounts_OAuth_Custom_Custom_Fields_Map_Description',
					persistent: true,
					sorter: Settings.findOne({ _id: `Accounts_OAuth_Custom-${ name }-groups_channel_map` }).sorter,
				});
			}
		});
	},
});
