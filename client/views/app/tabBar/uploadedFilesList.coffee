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

  customClassForFileType: ->
    if this.type.match(/^image\/.+$/)
      return 'room-files-swipebox'


Template.uploadedFilesList.events
  'click .room-file-item': (e, t) ->
    if $(e.currentTarget).siblings('.icon-picture').length
      e.preventDefault()


Template.uploadedFilesList.onCreated ->
  instance = this
  this.autorun ->
    instance.subscribe 'roomFiles', Session.get('openedRoom')

Template.uploadedFilesList.onRendered ->
  $('.room-files-swipebox').swipebox()
