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
		lastMessage = ChatMessageHistory.findOne({rid: rid}, {sort: {ts: 1}})
		lastMessage ?= ChatMessage.findOne({rid: rid}, {sort: {ts: 1}})

		if lastMessage?
			ts = lastMessage.ts
		else
			ts = new Date

		Meteor.call 'loadHistory', rid, ts, limit, 0, (err, result) ->
			ChatMessageHistory.insert item for item in result
			room.isLoading.set false
			room.loaded += result.length
			if result.length < limit
				room.hasMore.set false

	hasMore = (rid) ->
		room = getRoom rid

		return room.hasMore.get()

	isLoading = (rid) ->
		room = getRoom rid

		return room.isLoading.get()


	getMore: getMore
	hasMore: hasMore
	isLoading: isLoading
