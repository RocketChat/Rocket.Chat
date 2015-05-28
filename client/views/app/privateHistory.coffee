Template.privateHistory.helpers
	history: ->
		items = ChatRoom.find { name: { $regex: Session.get('historyFilter'), $options: 'i' }, t: { $in: ['d', 'c', 'p'] } }, {'sort': { 'ts': -1 } }
		return {
			items: items
			length: items.count()
		}

	type: ->
		switch this.t
			when 'd' then 'icon-at'
			when 'c' then 'icon-hash'
			when 'p' then 'icon-lock'

	creation: ->
		return moment(this.ts).format('LLL')

	lastMessage: ->
		return moment(this.lm).format('LLL') if this.lm

Template.privateHistory.events
	'keydown #history-filter': (event) ->
		if event.which is 13
			event.stopPropagation()
			event.preventDefault()

	'keyup #history-filter': (event) ->
		event.stopPropagation()
		event.preventDefault()

		Session.set('historyFilter', event.currentTarget.value)
