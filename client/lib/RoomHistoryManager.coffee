@RoomHistoryManager = new class
	defaultLimit = 50

	histories = {}

	getRoom = (rid) ->
		if not histories[rid]?
			histories[rid] =
				hasMore: ReactiveVar true
				isLoading: ReactiveVar false
				unreadNotLoaded: ReactiveVar 0
				loaded: 0

		return histories[rid]

	getMore = (rid, limit=defaultLimit) ->
		room = getRoom rid
		if room.hasMore.curValue isnt true
			return

		room.isLoading.set true

		# ScrollListener.setLoader true
		lastMessage = ChatMessage.findOne({rid: rid}, {sort: {ts: 1}})
		# lastMessage ?= ChatMessage.findOne({rid: rid}, {sort: {ts: 1}})

		if lastMessage?
			ts = lastMessage.ts
		else
			ts = new Date

		ls = undefined

		subscription = ChatSubscription.findOne rid: rid
		if subscription?
			ls = subscription.ls

		Meteor.call 'loadHistory', rid, ts, limit, ls, (err, result) ->
			room.unreadNotLoaded.set result.unreadNotLoaded

			wrapper = $('.messages-box .wrapper').get(0)
			previousHeight = wrapper.scrollHeight

			ChatMessage.insert item for item in result.messages

			heightDiff = wrapper.scrollHeight - previousHeight
			wrapper.scrollTop += heightDiff

			Meteor.defer ->
				readMessage.refreshUnreadMark(rid, true)
				RoomManager.updateMentionsMarksOfRoom subscription.t + subscription.name

			room.isLoading.set false
			room.loaded += result.messages.length
			if result.messages.length < limit
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

	getRoom: getRoom
	getMore: getMore
	getMoreIfIsEmpty: getMoreIfIsEmpty
	hasMore: hasMore
	isLoading: isLoading
	clear: clear
