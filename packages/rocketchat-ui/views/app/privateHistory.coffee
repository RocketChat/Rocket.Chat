import moment from 'moment'

Template.privateHistory.helpers
	history: ->
		items = ChatSubscription.find { name: { $regex: Session.get('historyFilter'), $options: 'i' }, t: { $in: ['d', 'c', 'p'] }, archived: { $ne: true } }, {'sort': { 'ts': -1 } }
		return {
			items: items
			length: items.count()
		}

	archivedHistory: ->
		items = ChatSubscription.find { name: { $regex: Session.get('historyFilter'), $options: 'i' }, t: { $in: ['d', 'c', 'p'] }, archived: true }, {'sort': { 'ts': -1 } }
		return {
			items: items
			length: items.count()
		}

	roomOf: (rid) ->
		return ChatRoom.findOne rid

	type: ->
		switch this.t
			when 'd' then 'icon-at'
			when 'c' then 'icon-hash'
			when 'p' then 'icon-lock'

	creation: ->
		return moment(this.ts).format('LLL')

	lastMessage: ->
		return moment(this.lm).format('LLL') if this.lm

	path: ->
		switch this.t
			when 'c'
				return FlowRouter.path 'channel', { name: this.name }
			when 'p'
				return FlowRouter.path 'group', { name: this.name }
			when 'd'
				return FlowRouter.path 'direct', { username: this.name }

Template.privateHistory.events
	'keydown #history-filter': (event) ->
		if event.which is 13
			event.stopPropagation()
			event.preventDefault()

	'keyup #history-filter': (event) ->
		event.stopPropagation()
		event.preventDefault()

		Session.set('historyFilter', event.currentTarget.value)
