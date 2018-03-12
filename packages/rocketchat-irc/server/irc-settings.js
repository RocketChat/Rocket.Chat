Meteor.startup(function () {
	RocketChat.settings.addGroup('IRC', function () {
		this.add('IRC_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'IRC_Enabled'
		})

		this.add('IRC_Protocol', 'RFC2813', {
			type: 'select',
			i18nLabel: 'Protocol',
			i18nDescription: 'IRC_Protocol',
			values: [
				{
					key: 'RFC2813',
					i18nLabel: 'RFC2813'
				}
			]
		})

		this.add('IRC_Host', 'localhost', {
			type: 'string',
			i18nLabel: 'Host',
			i18nDescription: 'IRC_Host'
		})

		this.add('IRC_Port', 6667, {
			type: 'int',
			i18nLabel: 'Port',
			i18nDescription: 'IRC_Port'
		})

		this.add('IRC_Name', 'irc.rocket.chat', {
			type: 'string',
			i18nLabel: 'Name',
			i18nDescription: 'IRC_Name'
		})

		this.add('IRC_Description', 'Rocket.Chat IRC Bridge', {
			type: 'string',
			i18nLabel: 'Description',
			i18nDescription: 'IRC_Description'
		})

		this.add('IRC_Local_Password', 'password', {
			type: 'string',
			i18nLabel: 'Local_Password',
			i18nDescription: 'IRC_Local_Password'
		})

		this.add('IRC_Peer_Password', 'password', {
			type: 'string',
			i18nLabel: 'Peer_Password',
			i18nDescription: 'IRC_Peer_Password'
		})
	})
})
