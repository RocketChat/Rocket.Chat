if Meteor.isServer
  fileStore = new (FS.Store.GridFS)('files', {})
  Files = new (FS.Collection) 'Files',
    stores: [fileStore],
    filter:
      allow:
        contentTypes: ['image/*']

if Meteor.isClient
  fileStore = new (FS.Store.GridFS)('files')
  Files = new (FS.Collection) 'Files',
    stores: [fileStore],
    filter:
      maxSize: 1048576,
      allow:
        contentTypes: ['image/*']
      onInvalid: (message) ->
        toastr.error message
        return

# Allow rules
Files.allow
  insert: ->
    true
  update: ->
    false
  download: ->
    true
  remove: ->
    false

Files.deny
  insert: ->
    false
  update: ->
    true
  remove: ->
    true
  download: ->
    false
