Meteor.methods
  deleteFileMessage: (fileID) ->
    Meteor.call 'deleteMessage', RocketChat.models.Messages.getMessageByFileId(fileID)
