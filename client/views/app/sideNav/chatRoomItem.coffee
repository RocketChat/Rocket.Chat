Template.chatRoomItem.helpers
	unread: ->
		if (not Router.current().params._id) or Router.current().params._id isnt this.rid
			return this.unread
		else if Router.current().params._id is this.rid and this.unread > 0
			Meteor.call 'readMessages', this.rid

	mentions: ->
		if (not Router.current().params._id) or Router.current().params._id isnt this.rid
			return this.mentions
		else if Router.current().params._id is this.rid and this.mentions > 0
			Meteor.call 'readMessages', this.rid

	isDirectRoom: ->
		return this.t is 'd'

	userStatus: ->
		switch this.t
			when 'd'
				username = this.rid.replace Meteor.user().username, ''
				UserManager.addUser username
				return 'status-' + Session.get('user_' + username + '_status')
			else return ''

	name: ->
		return this.rn

	roomIcon: ->
		switch this.t
			when 'd' then return 'icon-at'
			when 'c' then return 'icon-hash'
			when 'p' then return 'icon-lock'

	active: ->
		return 'active' if Router.current().params._id? and Router.current().params._id is this.rid

	canLeave: ->
		roomData = Session.get('roomData' + this.rid)

		return false unless roomData

		if (roomData.cl? and not roomData.cl) or roomData.t is 'd' or (roomData.usernames.indexOf(Meteor.user().username) isnt -1 and roomData.usernames.length is 1)
			return false
		else
			return true

Template.chatRoomItem.rendered = ->
	if @data.t is 'd'
		username = @data.rid.replace Meteor.user().username, ''
		UserManager.addUser username

	if not (Router.current().params._id? and Router.current().params._id is this.data.rid) and (not this.data.ls? or moment(this.data.ls).add(1, 'days').startOf('day') < moment(this.data.ts).startOf('day'))
		KonchatNotification.newRoom(this.data.rid)
		# console.log 'toca ', this.data.rid

Template.chatRoomItem.events
	'click .hide-room': (e) ->
		e.stopPropagation()
		e.preventDefault()

		if (Router.current().route.getName() is 'room' and Router.current().params._id is this.rid)
			Router.go 'index'

		RoomManager.close this.rid

		Meteor.call 'hideRoom', this.rid

	'click .leave-room': (e) ->
		e.stopPropagation()
		e.preventDefault()

		if (Router.current().route.getName() is 'room' and Router.current().params._id is this.rid)
			Router.go 'index'

		RoomManager.close this.rid

		Meteor.call 'leaveRoom', this.rid
