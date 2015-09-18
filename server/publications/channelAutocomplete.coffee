Meteor.publish 'channelAutocomplete', (name) ->
  unless this.userId
    return this.ready()

  console.log '[publish] channelAutocomplete -> '.green, name

  exp = new RegExp(name, 'i')

  query =
    name: exp
    t: 'c'

  options =
    fields:
      _id: 1
      name: 1
    limit: 10

  pub = this

  cursorHandle = ChatRoom.find(query, options).observeChanges
    added: (_id, record) ->
      pub.added('channel-autocomplete', _id, record)

    changed: (_id, record) ->
      pub.changed('channel-autocomplete', _id, record)

    removed: (_id, record) ->
      pub.removed('channel-autocomplete', _id, record)

  @ready()
  @onStop ->
    cursorHandle.stop()
  return
