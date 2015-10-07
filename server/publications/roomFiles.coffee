Meteor.publish 'roomFiles', (rid) ->
  unless this.userId
    return this.ready()

  console.log '[publish] roomFiles '.green, rid

  pub = this

  fileQuery =
    rid: rid
    complete: true
    uploading: false

  fileOptions =
    fields:
      _id: 1
      rid: 1
      name: 1
      type: 1
      url: 1

  cursorFileListHandle = fileCollection.find(fileQuery, fileOptions).observeChanges
    added: (_id, record) ->
      pub.added('room_files', _id, record)

    changed: (_id, record) ->
      pub.changed('room_files', _id, record)

    removed: (_id, record) ->
      pub.removed('room_files', _id, record)

  this.ready()
  this.onStop ->
    cursorFileListHandle.stop()
