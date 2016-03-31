Template.chatRoomItem.helpers

	alert: ->
		if FlowRouter.getParam('_id') isnt this.rid or not document.hasFocus()
			return this.alert

	unread: ->
		if (FlowRouter.getParam('_id') isnt this.rid or not document.hasFocus()) and this.unread > 0
			return this.unread

	userStatus: ->
		return 'status-' + (Session.get('user_' + this.name + '_status') or 'offline')

	name: ->
		return this.name

	roomIcon: ->
		return RocketChat.roomTypes.getIcon this.t

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
		return RocketChat.roomTypes.getRouteLink @t, @

Template.chatRoomItem.rendered = ->
	if not (FlowRouter.getParam('_id')? and FlowRouter.getParam('_id') is this.data.rid) and not this.data.ls and this.data.alert is true
		KonchatNotification.newRoom(this.data.rid)

Template.chatRoomItem.events

	'click .open-room': (e) ->
		menu.close()

	'click .hide-room': (e) ->
		e.stopPropagation()
		e.preventDefault()

		rid = this.rid
		name = this.name

		warnText = switch
			when this.t == 'c' then 'Hide_Room_Warning'
			when this.t == 'p' then 'Hide_Group_Warning'
			when this.t == 'd' then 'Hide_Private_Warning'


		swal {
			title: t('Are_you_sure')
			text: t(warnText, name)
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: t('Yes_hide_it')
			cancelButtonText: t('Cancel')
			closeOnConfirm: true
			html: false
		}, ->
			if FlowRouter.getRouteName() in ['channel', 'group', 'direct'] and Session.get('openedRoom') is rid
				FlowRouter.go 'home'

			Meteor.call 'hideRoom', rid

	'click .leave-room': (e) ->
		e.stopPropagation()
		e.preventDefault()

		rid = this.rid
		name = this.name

		warnText = switch
			when this.t == 'c' then 'Leave_Room_Warning'
			when this.t == 'p' then 'Leave_Group_Warning'
			when this.t == 'd' then 'Leave_Private_Warning'
		swal {
			title: t('Are_you_sure')
			text: t(warnText, name)
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: t('Yes_leave_it')
			cancelButtonText: t('Cancel')
			closeOnConfirm: false
			html: false
		}, (isConfirm) ->
			if isConfirm
				Meteor.call 'leaveRoom', rid, (err) ->
					if err
						swal {
							title: t('Warning')
							text: t(err.reason)
							type: 'warning'
							html: false
						}

					else
						swal.close()
						if FlowRouter.getRouteName() in ['channel', 'group', 'direct'] and Session.get('openedRoom') is rid
							FlowRouter.go 'home'

						RoomManager.close rid
			else
				swal.close()