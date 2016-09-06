RocketChat.Migrations.add({
	version: 40,
	up: function() {
		RocketChat.models.Settings.find({ _id: /Accounts_OAuth_Custom_/, i18nLabel: 'Accounts_OAuth_Custom_Enable' }).forEach(function(customOauth) {
			var parts = customOauth._id.split('_');
			var name = parts[3];
			var id = 'Accounts_OAuth_Custom_' + name + '_token_sent_via';
			if (!RocketChat.models.Settings.findOne({ _id: id })) {
				RocketChat.models.Settings.insert({
					'_id': id,
					'type': 'select',
					'group': 'OAuth',
					'section': 'Custom OAuth: ' + name,
					'i18nLabel': 'Accounts_OAuth_Custom_Token_Sent_Via',
					'persistent': true,
					'values': [
						{
							'key': 'header',
							'i18nLabel': 'Header'
						},
						{
							'key': 'payload',
							'i18nLabel': 'Payload'
						}
					],
					'packageValue': 'payload',
					'valueSource': 'packageValue',
					'ts': new Date(),
					'hidden': false,
					'blocked': false,
					'sorter': 255,
					'i18nDescription': 'Accounts_OAuth_Custom_' + name + '_token_sent_via_Description',
					'createdAt': new Date(),
					'value': 'payload'
				});
			}
		});
	}
});
