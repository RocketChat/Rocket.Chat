Meteor.publish 'roomFiles', (rid) ->
  unless this.userId
    return this.ready()

  console.log '[publish] roomFiles'.green, rid

  # list of channel messages which were created after uploading a file
  msgQuery =
    rid: rid
    'file._id': { $exists: true }
  msgOptions =
    fields:
      _id: 1
      'file._id': 1
  cursorFileMessages = RocketChat.models.Messages.find(msgQuery, msgOptions);
  uploadedFilesMessages = cursorFileMessages.fetch()
  unless uploadedFilesMessages
    return this.ready()

  uploadIdList = _.map(uploadedFilesMessages, (doc) -> return doc?.file?._id)
  unless uploadIdList
    return this.ready()

  fileQuery =
    _id: { $in : uploadIdList }
    complete: true
    uploading: false

  fileOptions =
    fields:
      _id: 1
      name: 1
      type: 1
      url: 1

  fileCollection.find(fileQuery, fileOptions)
  this.ready()

  # observe whether a new file was sent to the room and notifies subscribers
  pub = this
  cursorFileMessagesHandle = cursorFileMessages.observeChanges
    added: (_id, record) ->
      unless record?.file?._id
        return pub.ready()

      data = fileCollection.findOne({ _id: record.file._id }, fileOptions)
      pub.added('rocketchat_uploads', record.file._id, data)

  this.onStop ->
    cursorFileMessagesHandle.stop()
