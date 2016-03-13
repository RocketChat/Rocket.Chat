RocketChat.Migrations.add
	version: 9
	up: ->
		# Migrate existing source collection data to target collection
		# target collection is defined in collections.coffee using the new collection name
		# source collection is dropped after data migration
		toMigrate = [
			{
				source: new Meteor.Collection 'data.ChatRoom'
				target: RocketChat.models.Rooms.model
			}
			{
				source: new Meteor.Collection 'data.ChatSubscription'
				target: RocketChat.models.Subscriptions.model
			}
			{
				source: new Meteor.Collection 'data.ChatMessage'
				target: RocketChat.models.Messages.model
			}
			{
				source: new Meteor.Collection 'settings'
				target: Settings
			}
			{
				# this collection may not exit
				source: new Meteor.Collection 'oembed_cache'
				target: OEmbed.cache
			}
		]

		toMigrate.forEach ( collection ) ->
			source = collection.source
			target = collection.target

			# rawCollection available as of Meteor 1.0.4
			console.log 'Migrating data from: ' + source.rawCollection().collectionName + ' to: ' + target.rawCollection().collectionName
			source.find().forEach ( doc ) ->
				# use upsert to account for GENERAL room created by initialData
				target.upsert({_id: doc._id}, doc )

			rawSource = source.rawCollection()
			# drop old collection
			Meteor.wrapAsync(rawSource.drop, rawSource )((err,res) ->
				if err
					console.log 'Error dropping '  + rawSource.collectionName + ' collection due to: ' + err.errmsg
			)

			# Note: the following would have been much easier, but didn't work.  The serverside
			# data was not published to the client for some reason.
			# newName = target.rawCollection().collectionName
			# Meteor.wrapAsync(rawSource.rename, rawSource )(newName, {dropTarget:true})

