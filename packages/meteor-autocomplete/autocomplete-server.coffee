class Autocomplete
  @publishCursor: (cursor, sub) ->
    # This also attaches an onStop callback to sub, so we don't need to worry about that.
    # https://github.com/meteor/meteor/blob/devel/packages/mongo/collection.js
    Mongo.Collection._publishCursor(cursor, sub, "autocompleteRecords")

Meteor.publish 'autocomplete-recordset', (selector, options, collName) ->
  collection = global[collName]
  unless collection
    throw new Error(collName + ' is not defined on the global namespace of the server.')

  # This is a semi-documented Meteor feature:
  # https://github.com/meteor/meteor/blob/devel/packages/mongo-livedata/collection.js
  unless collection._isInsecure()
    Meteor._debug(collName + ' is a secure collection, therefore no data was returned because the client could compromise security by subscribing to arbitrary server collections via the browser console. Please write your own publish function.')
    return [] # We need this for the subscription to be marked ready

  # guard against client-side DOS: hard limit to 50
  options.limit = Math.min(50, Math.abs(options.limit)) if options.limit

  # Push this into our own collection on the client so they don't interfere with other publications of the named collection.
  # This also stops the observer automatically when the subscription is stopped.
  Autocomplete.publishCursor( collection.find(selector, options), this)

  # Mark the subscription ready after the initial addition of documents.
  this.ready()

