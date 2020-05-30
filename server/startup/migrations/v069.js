import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 69,
	up() {
		Settings.update({
			_id: 'theme-color-custom-scrollbar-color',
			value: 'rgba(255, 255, 255, 0.05)',
		}, {
			$set: {
				editor: 'expression',
				value: '@transparent-darker',
			},
		});
		Settings.update({
			_id: 'theme-color-info-font-color',
			value: '#aaaaaa',
		}, {
			$set: {
				editor: 'expression',
				value: '@secondary-font-color',
			},
		});
		Settings.update({
			_id: 'theme-color-link-font-color',
			value: '#008ce3',
		}, {
			$set: {
				editor: 'expression',
				value: '@primary-action-color',
			},
		});
		Settings.update({
			_id: 'theme-color-status-away',
			value: '#fcb316',
		}, {
			$set: {
				editor: 'expression',
				value: '@pending-color',
			},
		});
		Settings.update({
			_id: 'theme-color-status-busy',
			value: '#d30230',
		}, {
			$set: {
				editor: 'expression',
				value: '@error-color',
			},
		});
		Settings.update({
			_id: 'theme-color-status-offline',
			value: 'rgba(150, 150, 150, 0.50)',
		}, {
			$set: {
				editor: 'expression',
				value: '@transparent-darker',
			},
		});
		Settings.update({
			_id: 'theme-color-status-online',
			value: '#35ac19',
		}, {
			$set: {
				editor: 'expression',
				value: '@success-color',
			},
		});
		Settings.update({
			_id: 'theme-color-tertiary-background-color',
			value: '#eaeaea',
		}, {
			$set: {
				editor: 'expression',
				value: '@component-color',
			},
		});
		return Settings.update({
			_id: 'theme-color-tertiary-font-color',
			value: 'rgba(255, 255, 255, 0.6)',
		}, {
			$set: {
				editor: 'expression',
				value: '@transparent-lightest',
			},
		});
	},
});
