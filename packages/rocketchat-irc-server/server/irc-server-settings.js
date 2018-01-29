Meteor.startup(function() {
	RocketChat.settings.addGroup('IRC_Server', function() {
		this.add('IRC_Server_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'IRC_Server_Enabled'
		});

		this.add('IRC_Server_Host', 'irc.freenode.net', {
			type: 'string',
			i18nLabel: 'Host',
			i18nDescription: 'IRC_Server_Host'
		});

		this.add('IRC_Server_Port', 6667, {
			type: 'int',
			i18nLabel: 'Port',
			i18nDescription: 'IRC_Server_Port'
		});

		this.add('IRC_Server_Id', '', {
			type: 'string',
			i18nLabel: 'Id',
			i18nDescription: 'IRC_Server_Id'
		});

		this.add('IRC_Server_Send_Password', '', {
			type: 'string',
			i18nLabel: 'Send_Password',
			i18nDescription: 'IRC_Server_Send_Password'
		});

		this.add('IRC_Server_Receive_Password', '', {
			type: 'string',
			i18nLabel: 'Receive_Password',
			i18nDescription: 'IRC_Server_Receive_Password'
		});

		this.add('IRC_Server_Name', '', {
			type: 'string',
			i18nLabel: 'Name',
			i18nDescription: 'IRC_Server_Name'
		});

		this.add('IRC_Server_Description', '', {
			type: 'string',
			i18nLabel: 'Description',
			i18nDescription: 'IRC_Server_Description'
		});
	});
});
