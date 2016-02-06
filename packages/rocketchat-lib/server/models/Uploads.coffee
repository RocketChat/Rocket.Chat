RocketChat.models.Uploads = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'uploads'

		@tryEnsureIndex { 'rid': 1 }
		@tryEnsureIndex { 'uploadedAt': 1 }
