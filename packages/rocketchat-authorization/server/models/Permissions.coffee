class ModelPermissions extends RocketChat.models._Base
	constructor: ->
		super(arguments...)

	# FIND
	findByRole: (role, options) ->
		query =
			roles: role

		return @find query, options

	findOneById: (_id) ->
		return @findOne _id

	createOrUpdate: (name, roles) ->
		@upsert { _id: name }, { $set: { roles: roles } }

	addRole: (permission, role) ->
		@update({ _id: permission }, { $addToSet: { roles: role } })

	removeRole: (permission, role) ->
		@update({ _id: permission }, { $pull: { roles: role } })


RocketChat.models.Permissions = new ModelPermissions('permissions')
