@RoomHistoryManager = new class
	defaultLimit = 50

	histories = {}

	getRoom = (rid) ->
		if not histories[rid]?
			histories[rid] =
				hasMore: ReactiveVar true
				isLoading: ReactiveVar false
				loaded: 0

		return histories[rid]

	getMore = (rid, limit=defaultLimit) ->
		room = getRoom rid
		if room.hasMore.curValue isnt true
			return

		room.isLoading.set true

		#$('.messages-box .wrapper').data('previous-height', $('.messages-box .wrapper').get(0)?.scrollHeight - $('.messages-box .wrapper').get(0)?.scrollTop)
		# ScrollListener.setLoader true
		lastMessage = ChatMessage.findOne({rid: rid}, {sort: {ts: 1}})
		# lastMessage ?= ChatMessage.findOne({rid: rid}, {sort: {ts: 1}})

		if lastMessage?
			ts = lastMessage.ts
		else
			ts = new Date

		Meteor.call 'loadHistory', rid, ts, limit, undefined, (err, result) ->
			return if err?

			for item in result?.messages or []
				if item.t isnt 'command'
					ChatMessage.upsert {_id: item._id}, item
			room.isLoading.set false
			if result?.messages?.length?
				room.loaded += result.messages.length
			if result?.messages?.length < limit
				room.hasMore.set false

	hasMore = (rid) ->
		room = getRoom rid

		return room.hasMore.get()

	getMoreIfIsEmpty = (rid) ->
		room = getRoom rid

		if room.loaded is 0
			getMore rid

	isLoading = (rid) ->
		room = getRoom rid

		return room.isLoading.get()

	clear = (rid) ->
		ChatMessage.remove({ rid: rid })
		if histories[rid]?
			histories[rid].hasMore.set true
			histories[rid].isLoading.set false
			histories[rid].loaded = 0

	getMore: getMore
	getMoreIfIsEmpty: getMoreIfIsEmpty
	hasMore: hasMore
	isLoading: isLoading
	clear: clear
