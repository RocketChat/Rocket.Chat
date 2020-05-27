import { Random } from 'meteor/random';

import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';
import { settings } from '../../../app/settings/server';

Migrations.add({
	version: 157,
	up() {
		Settings.upsert({
			_id: 'FileUpload_Enable_json_web_token_for_files',
		},
		{
			_id: 'FileUpload_Enable_json_web_token_for_files',
			value: settings.get('FileUpload_ProtectFiles'),
			type: 'boolean',
			group: 'FileUpload',
			i18nLabel: 'FileUpload_Enable_json_web_token_for_files',
			i18nDescription: 'FileUpload_Enable_json_web_token_for_files_description',
			enableQuery: {
				_id: 'FileUpload_ProtectFiles',
				value: true,
			},
		});
		Settings.upsert({
			_id: 'FileUpload_json_web_token_secret_for_files',
		},
		{
			_id: 'FileUpload_json_web_token_secret_for_files',
			value: Random.secret(),
			type: 'string',
			group: 'FileUpload',
			i18nLabel: 'FileUpload_json_web_token_secret_for_files',
			i18nDescription: 'FileUpload_json_web_token_secret_for_files_description',
			enableQuery: {
				_id: 'FileUpload_Enable_json_web_token_for_files',
				value: true,
			},
		});
	},
	down() {
		// Down migration does not apply in this case
	},
});
