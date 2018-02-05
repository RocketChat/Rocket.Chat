Meteor.startup(function() {
	RocketChat.settings.addGroup('IRC_Server', function() {
		this.add('IRC_Server_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'IRC_Server_Enabled'
		});

		this.add('IRC_Server_Host', '172.17.0.1', {
			type: 'string',
			i18nLabel: 'Host',
			i18nDescription: 'IRC_Server_Host'
		});

		this.add('IRC_Server_Port', 7000, {
			type: 'int',
			i18nLabel: 'Port',
			i18nDescription: 'IRC_Server_Port'
		});

		this.add('IRC_Server_Id', '777', {
			type: 'string',
			i18nLabel: 'Id',
			i18nDescription: 'IRC_Server_Id'
		});

		this.add('IRC_Server_Send_Password', 'password', {
			type: 'string',
			i18nLabel: 'Send_Password',
			i18nDescription: 'IRC_Server_Send_Password'
		});

		this.add('IRC_Server_Receive_Password', 'password', {
			type: 'string',
			i18nLabel: 'Receive_Password',
			i18nDescription: 'IRC_Server_Receive_Password'
		});

		this.add('IRC_Server_Name', 'irc.example.com', {
			type: 'string',
			i18nLabel: 'Name',
			i18nDescription: 'IRC_Server_Name'
		});

		this.add('IRC_Server_Description', 'IRC Network', {
			type: 'string',
			i18nLabel: 'Description',
			i18nDescription: 'IRC_Server_Description'
		});
	});
});
