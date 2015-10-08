Template.channelSettings.helpers
	notDirect: ->
		return ChatRoom.findOne(@rid).t isnt 'd'
	roomType: ->
		return ChatRoom.findOne(@rid).t

Template.channelSettings.onCreated ->
