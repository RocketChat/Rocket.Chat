Template.uploadedFilesList.helpers
  files: ->
    return fileCollection.find().fetch()

  hasFiles: ->
      return fileCollection.find().count() > 0

  getFileIcon: (type) ->
    if type.match(/^image\/.+$/)
      return 'icon-picture'

    return 'icon-docs'

Template.uploadedFilesList.onCreated ->
  instance = this
  this.autorun ->
    instance.subscribe 'roomFiles', Session.get('openedRoom')
