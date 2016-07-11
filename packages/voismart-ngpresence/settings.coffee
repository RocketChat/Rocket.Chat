Meteor.startup ->
	RocketChat.settings.addGroup 'OrchestraIntegration', ->
		@section 'OrchestraPresence', ->
			@add 'OrchestraIntegration_PresenceEnabled', false, { type: 'boolean', public: true }
			@add 'OrchestraIntegration_APIUser', '', { type: 'string', public: true }
			@add 'OrchestraIntegration_APIPassword', '', { type: 'string', public: true }
			@add 'OrchestraIntegration_BrokerHost', '', { type: 'string', public: true }
			@add 'OrchestraIntegration_BrokerUser', '', { type: 'string', public: true }
			@add 'OrchestraIntegration_BrokerPassword', '', { type: 'string', public: true }
