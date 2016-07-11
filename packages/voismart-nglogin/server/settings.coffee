Meteor.startup ->
	RocketChat.settings.addGroup 'OrchestraIntegration', ->
		@add 'OrchestraIntegration_Domain', '', { type: 'string', public: true }
		@add 'OrchestraIntegration_Server', '', { type: 'string', public: true }
		@section 'OrchestraIntegration_Login', ->
			@add 'OrchestraIntegration_Enabled', false, { type: 'boolean', public: true }

		@add 'Restart', 'restart_server', { type: 'action', actionText: 'Restart_the_server' }
