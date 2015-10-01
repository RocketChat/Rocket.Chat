roomFiles = new Mongo.Collection 'room_files'

Template.uploadedFilesList.helpers
  files: ->
    return roomFiles.find().fetch()

  hasFiles: ->
      return roomFiles.find().count() > 0

  getFileIcon: (type) ->
    if type.match(/^image\/.+$/)
      return 'icon-picture'

    return 'icon-docs'

Template.uploadedFilesList.onCreated ->
  instance = this
  this.autorun ->
    instance.subscribe 'roomFiles', Session.get('openedRoom')
