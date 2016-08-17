RocketChat.settings.addGroup 'Message', ->
	@section 'Message_Attachments', ->
	    @add 'Message_VideoRecorderEnabled', true, { type: 'boolean', public: true, i18nDescription: 'Message_VideoRecorderEnabledDescription' }
