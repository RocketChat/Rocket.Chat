Meteor.startup ->
	Migrations.add
		version: 9
		up: ->
			# Migrate existing source collection data to target collection
			# target collection is defined in collections.coffee using the new collection name
			toMigrate = [ 
				{
					source: new Meteor.Collection 'data.ChatRoom'
					target: ChatRoom 
				}
				{
					source: new Meteor.Collection 'data.ChatSubscription'
					target: ChatSubscription 
				}
				{
					source: new Meteor.Collection 'data.ChatMessage'
					target: ChatMessage 
				}
			]

			toMigrate.forEach ( collection ) ->
				source = collection.source
				target = collection.target
				# rawCollection available as of Meteor 1.0.4
				console.log 'Migrating data from: ' + source.rawCollection().collectionName + ' to: ' + target.rawCollection().collectionName
				source.find().forEach ( doc ) ->
					target.upsert({_id: doc._id}, doc )

				rawSource = source.rawCollection();
				Meteor.wrapAsync(rawSource.drop, rawSource )()

				# Note: the following would have been much easier, but didn't work.  The serverside
				# data was not published to the client for some reason.  
				# newName = target.rawCollection().collectionName
				# Meteor.wrapAsync(rawSource.rename, rawSource )(newName, {dropTarget:true}) 

