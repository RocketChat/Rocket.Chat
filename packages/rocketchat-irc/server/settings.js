Meteor.startup(function() {
	RocketChat.settings.addGroup('IRC', function() {

		// Is this thing on?
		this.add('IRC_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'IRC_Enabled',
			alert: 'IRC Support is a work in progress. Use on a production system is not recommended at this time.'
		});

		// The IRC host server to talk to
		this.add('IRC_Host', 'irc.freenode.net', {
			type: 'string',
			i18nLabel: 'Host',
			i18nDescription: 'IRC_Hostname'
		});

		// The port to connect on the remote server
		this.add('IRC_Port', 6667, {
			type: 'int',
			i18nLabel: 'Port',
			i18nDescription: 'IRC_Port'
		});

		// Cache size of the messages we send the host IRC server
		this.add('IRC_Message_Cache_Size', 200, {
			type: 'int',
			i18nLabel: 'Message Cache Size',
			i18nDescription: 'IRC_Message_Cache_Size'
		});

		// Expandable box for modifying regular expressions for IRC interaction
		this.section('Regular_Expressions', function() {
			this.add('IRC_RegEx_successLogin', 'Welcome to the freenode Internet Relay Chat Network', {
				type: 'string',
				i18nLabel: 'Login Successful',
				i18nDescription: 'IRC_Login_Success'
			});
			this.add('IRC_RegEx_failedLogin', 'You have not registered', {
				type: 'string',
				i18nLabel: 'Login Failed',
				i18nDescription: 'IRC_Login_Fail'
			});
			this.add('IRC_RegEx_receiveMessage', '^:(\S+)!~\S+ PRIVMSG (\S+) :(.+)$', {
				type: 'string',
				i18nLabel: 'Private Message',
				i18nDescription: 'IRC_Private_Message'
			});
			this.add('IRC_RegEx_receiveMemberList', '^:\S+ \d+ \S+ = #(\S+) :(.*)$', {
				type: 'string',
				i18nLabel: 'Channel User List Start',
				i18nDescription: 'IRC_Channel_Users'
			});
			this.add('IRC_RegEx_endMemberList', '^.+#(\S+) :End of \/NAMES list.$', {
				type: 'string',
				i18nLabel: 'Channel User List End',
				i18nDescription: 'IRC_Channel_Users_End'
			});
			this.add('IRC_RegEx_addMemberToRoom', '^:(\S+)!~\S+ JOIN #(\S+)$', {
				type: 'string',
				i18nLabel: 'Join Channel',
				i18nDescription: 'IRC_Channel_Join'
			});
			this.add('IRC_RegEx_removeMemberFromRoom', '^:(\S+)!~\S+ PART #(\S+)$', {
				type: 'string',
				i18nLabel: 'Leave Channel',
				i18nDescription: 'IRC_Channel_Leave'
			});
			this.add('IRC_RegEx_quitMember', '^:(\S+)!~\S+ QUIT .*$', {
				type: 'string',
				i18nLabel: 'Quit IRC Session',
				i18nDescription: 'IRC_Quit'
			});
		});

	});
});
