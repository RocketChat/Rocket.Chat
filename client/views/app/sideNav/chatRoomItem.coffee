Template.chatRoomItem.helpers

	alert: ->
		if FlowRouter.getParam('_id') isnt this.rid or not document.hasFocus()
			return this.alert

	unread: ->
		if (FlowRouter.getParam('_id') isnt this.rid or not document.hasFocus()) and this.unread > 0
			return this.unread

	isDirectRoom: ->
		return this.t is 'd'

	userStatus: ->
		return 'status-' + (Session.get('user_' + this.name + '_status') or 'offline') if this.t is 'd'
		return ''

	name: ->
		return this.name

	roomIcon: ->
		switch this.t
			when 'd' then return 'icon-at'
			when 'c' then return 'icon-hash'
			when 'p' then return 'icon-lock'

	active: ->
		if Session.get('openedRoom') is this.rid
			return 'active'

	canLeave: ->
		roomData = Session.get('roomData' + this.rid)

		return false unless roomData

		if (roomData.cl? and not roomData.cl) or roomData.t is 'd' or (roomData.usernames?.indexOf(Meteor.user().username) isnt -1 and roomData.usernames?.length is 1)
			return false
		else
			return true

	route: ->
		return switch this.t
			when 'd'
				FlowRouter.path('direct', {username: this.name})
			when 'p'
				FlowRouter.path('group', {name: this.name})
			when 'c'
				FlowRouter.path('channel', {name: this.name})

Template.chatRoomItem.rendered = ->
	if not (FlowRouter.getParam('_id')? and FlowRouter.getParam('_id') is this.data.rid) and not this.data.ls
		KonchatNotification.newRoom(this.data.rid)

Template.chatRoomItem.events

	'click .open-room': (e) ->
		menu.close()

	'click .hide-room': (e) ->
		e.stopPropagation()
		e.preventDefault()

		if FlowRouter.getRouteName() in ['channel', 'group', 'direct'] and Session.get('openedRoom') is this.rid
			FlowRouter.go 'home'

		Meteor.call 'hideRoom', this.rid

	'click .leave-room': (e) ->
		e.stopPropagation()
		e.preventDefault()

		if FlowRouter.getRouteName() in ['channel', 'group', 'direct'] and Session.get('openedRoom') is this.rid
			FlowRouter.go 'home'

		RoomManager.close this.rid

		Meteor.call 'leaveRoom', this.rid
