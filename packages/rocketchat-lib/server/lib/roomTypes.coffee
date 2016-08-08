RocketChat.roomTypes = new class roomTypesServer extends roomTypesCommon
	### add a publish for a room type
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param callback: function that will return the publish's data
	###
	setPublish: (roomType, callback) ->
		if @roomTypes[roomType]?.publish?
			throw new Meteor.Error 'route-publish-exists', 'Publish for the given type already exists'

		unless @roomTypes[roomType]?
			@roomTypes[roomType] = {}

		@roomTypes[roomType].publish = callback

	### run the publish for a room type
	@param scope: Meteor publish scope
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param identifier: identifier of the room
	###
	runPublish: (scope, roomType, identifier) ->
		return unless @roomTypes[roomType]?.publish?
		return @roomTypes[roomType].publish.call scope, identifier

