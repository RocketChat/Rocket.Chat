RocketChat.settings.addGroup 'Message', ->
	@add 'Message_VideoRecorderEnabled', true, { type: 'boolean', public: true, i18nDescription: 'Message_VideoRecorderEnabledDescription' }
