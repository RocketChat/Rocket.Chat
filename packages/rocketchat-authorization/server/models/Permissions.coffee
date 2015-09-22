RocketChat.models.Permissions = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'permissions'


	# FIND
	findByRole: (role, options) ->
		query =
			roles: role

		return @find query, options
