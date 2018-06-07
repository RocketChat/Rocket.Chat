RocketChat.Migrations.add({
	version: 104,
	up() {
		if ((RocketChat.models.Settings.findOne({_id: 'theme-color-rc-color-primary'}) || {}).value === '#04436A' &&
			(RocketChat.models.Settings.findOne({_id: 'theme-color-rc-color-primary-darkest'}) || {}).value === '#335a' &&
			(RocketChat.models.Settings.findOne({_id: 'theme-color-rc-color-primary-dark'}) || {}).value === '#16557c' &&
			(RocketChat.models.Settings.findOne({_id: 'theme-color-rc-color-primary-light'}) || {}).value === '#72b1d8' &&
			(RocketChat.models.Settings.findOne({_id: 'theme-color-rc-color-primary-light-medium'}) || {}).value === '#a0dfff' &&
			(RocketChat.models.Settings.findOne({_id: 'theme-color-rc-color-primary-lightest'}) || {}).value === '#ccffff'
		) {
			RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary'}, {$set: {editor: 'expression', value: 'color-dark'}});
			RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary-darkest'}, {$set: {editor: 'expression', value: 'color-darkest'}});
			RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary-dark'}, {$set: {editor: 'expression', value: 'color-dark-medium'}});
			RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary-light'}, {$set: {editor: 'expression', value: 'color-gray'}});
			RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary-light-medium'}, {$set: {editor: 'expression', value: 'color-gray-medium'}});
			RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary-lightest'}, {$set: {editor: 'expression', value: 'color-gray-lightest'}});
		}
	}
});
