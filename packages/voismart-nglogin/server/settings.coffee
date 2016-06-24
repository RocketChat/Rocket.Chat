Meteor.startup ->
	RocketChat.settings.addGroup 'OrchestraIntegration', ->
		@add 'OrchestraIntegration_Enabled', false, { type: 'boolean', public: true }
		@add 'OrchestraIntegration_Server', '', { type: 'string', public: true }
		@add 'OrchestraIntegration_Domain', '', { type: 'string', public: true }
