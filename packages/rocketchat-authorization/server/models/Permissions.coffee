RocketChat.models.Permissions = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'permissions'


	# FIND
	findByRole: (role, options) ->
		query =
			role: role

		return @findOne query, options
