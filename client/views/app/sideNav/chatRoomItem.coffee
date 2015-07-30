Template.chatRoomItem.helpers

	alert: ->
		return this.alert if (not FlowRouter.getParam('_id')) or FlowRouter.getParam('_id') isnt this.rid

	unread: ->
		return this.unread if (not FlowRouter.getParam('_id')) or FlowRouter.getParam('_id') isnt this.rid

	isDirectRoom: ->
		return this.t is 'd'

	userStatus: ->
		return 'status-' + Session.get('user_' + this.name + '_status') if this.t is 'd'
		return ''

	name: ->
		return this.name

	roomIcon: ->
		switch this.t
			when 'd' then return 'icon-at'
			when 'c' then return 'icon-hash'
			when 'p' then return 'icon-lock'

	active: ->
		if FlowRouter.getParam('_id')? and FlowRouter.getParam('_id') is this.rid
			if this.alert or this.unread > 0
				Meteor.call 'readMessages', this.rid
			return 'active'

	canLeave: ->
		roomData = Session.get('roomData' + this.rid)

		return false unless roomData

		if (roomData.cl? and not roomData.cl) or roomData.t is 'd' or (roomData.usernames?.indexOf(Meteor.user().username) isnt -1 and roomData.usernames?.length is 1)
			return false
		else
			return true

Template.chatRoomItem.rendered = ->
	if not (FlowRouter.getParam('_id')? and FlowRouter.getParam('_id') is this.data.rid) and not this.data.ls
		KonchatNotification.newRoom(this.data.rid)

Template.chatRoomItem.events

	'click .open-room': (e) ->
		$("#rocket-chat").addClass("menu-closed").removeClass("menu-opened")

	'click .hide-room': (e) ->
		e.stopPropagation()
		e.preventDefault()

		if (FlowRouter.getRouteName() is 'room' and FlowRouter.getParam('_id') is this.rid)
			FlowRouter.go 'index'

		Meteor.call 'hideRoom', this.rid

	'click .leave-room': (e) ->
		e.stopPropagation()
		e.preventDefault()

		if (FlowRouter.getRouteName() is 'room' and FlowRouter.getParam('_id') is this.rid)
			FlowRouter.go 'index'

		RoomManager.close this.rid

		Meteor.call 'leaveRoom', this.rid
