@RoomHistoryManager = new class
	defaultLimit = 50

	histories = {}

	getRoom = (rid) ->
		if not histories[rid]?
			histories[rid] =
				hasMore: new ReactiveVar true
				hasMoreNext: new ReactiveVar false
				isLoading: new ReactiveVar false
				unreadNotLoaded: new ReactiveVar 0
				firstUnread: new ReactiveVar
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
			ts = undefined

		ls = undefined
		typeName = undefined

		subscription = ChatSubscription.findOne rid: rid
		if subscription?
			ls = subscription.ls
			typeName = subscription.t + subscription.name
		else
			curRoomDoc = ChatRoom.findOne(_id: rid)
			typeName = curRoomDoc?.t + curRoomDoc?.name

		Meteor.call 'loadHistory', rid, ts, limit, ls, (err, result) ->
			room.unreadNotLoaded.set result?.unreadNotLoaded
			room.firstUnread.set result?.firstUnread

			wrapper = $('.messages-box .wrapper').get(0)
			if wrapper?
				previousHeight = wrapper.scrollHeight

			ChatMessage.upsert {_id: item._id}, item for item in result?.messages or [] when item.t isnt 'command'

			if wrapper?
				heightDiff = wrapper.scrollHeight - previousHeight
				wrapper.scrollTop += heightDiff

			Meteor.defer ->
				readMessage.refreshUnreadMark(rid, true)
				RoomManager.updateMentionsMarksOfRoom typeName

			room.isLoading.set false
			room.loaded += result?.messages?.length
			if result?.messages?.length < limit
				room.hasMore.set false

	getMoreNext = (rid, limit=defaultLimit) ->
		room = getRoom rid
		if room.hasMoreNext.curValue isnt true
			return

		instance = Blaze.getView($('.messages-box .wrapper')[0]).templateInstance()
		instance.atBottom = false

		room.isLoading.set true

		lastMessage = ChatMessage.findOne({rid: rid}, {sort: {ts: -1}})

		typeName = undefined

		subscription = ChatSubscription.findOne rid: rid
		if subscription?
			ls = subscription.ls
			typeName = subscription.t + subscription.name
		else
			curRoomDoc = ChatRoom.findOne(_id: rid)
			typeName = curRoomDoc?.t + curRoomDoc?.name

		ts = lastMessage.ts

		if ts
			Meteor.call 'loadNextMessages', rid, ts, limit, (err, result) ->
				for item in result?.messages or []
					if item.t isnt 'command'
						ChatMessage.upsert {_id: item._id}, item

				Meteor.defer ->
					RoomManager.updateMentionsMarksOfRoom typeName

				room.isLoading.set false
				room.loaded += result.messages.length
				if result.messages.length < limit
					room.hasMoreNext.set false

	getSurroundingMessages = (message, limit=defaultLimit) ->
		unless message?.rid
			return

		instance = Blaze.getView($('.messages-box .wrapper')[0]).templateInstance()

		if ChatMessage.findOne message._id
			wrapper = $('.messages-box .wrapper')
			msgElement = $("##{message._id}", wrapper)
			pos = wrapper.scrollTop() + msgElement.offset().top - wrapper.height()/2
			wrapper.animate({
				scrollTop: pos
			}, 500)
			msgElement.addClass('highlight')

			setTimeout ->
				messages = wrapper[0]
				instance.atBottom = messages.scrollTop >= messages.scrollHeight - messages.clientHeight;

			setTimeout ->
				msgElement.removeClass('highlight')
			, 3000
		else
			room = getRoom message.rid
			room.isLoading.set true
			ChatMessage.remove { rid: message.rid }

			typeName = undefined

			subscription = ChatSubscription.findOne rid: message.rid
			if subscription?
				ls = subscription.ls
				typeName = subscription.t + subscription.name
			else
				curRoomDoc = ChatRoom.findOne(_id: message.rid)
				typeName = curRoomDoc?.t + curRoomDoc?.name

			Meteor.call 'loadSurroundingMessages', message, limit, (err, result) ->
				for item in result?.messages or []
					if item.t isnt 'command'
						ChatMessage.upsert {_id: item._id}, item

				Meteor.defer ->
					readMessage.refreshUnreadMark(message.rid, true)
					RoomManager.updateMentionsMarksOfRoom typeName
					wrapper = $('.messages-box .wrapper')
					msgElement = $("##{message._id}", wrapper)
					pos = wrapper.scrollTop() + msgElement.offset().top - wrapper.height()/2
					wrapper.animate({
						scrollTop: pos
					}, 500)

					msgElement.addClass('highlight')

					setTimeout ->
						room.isLoading.set false
						messages = wrapper[0]
						instance.atBottom = !result.moreAfter && messages.scrollTop >= messages.scrollHeight - messages.clientHeight;
					, 500

					setTimeout ->
						msgElement.removeClass('highlight')
					, 3000
				room.loaded += result.messages.length
				room.hasMore.set result.moreBefore
				room.hasMoreNext.set result.moreAfter

	hasMore = (rid) ->
		room = getRoom rid

		return room.hasMore.get()

	hasMoreNext = (rid) ->
		room = getRoom rid
		return room.hasMoreNext.get()


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
	getMoreNext: getMoreNext
	getMoreIfIsEmpty: getMoreIfIsEmpty
	hasMore: hasMore
	hasMoreNext: hasMoreNext
	isLoading: isLoading
	clear: clear
	getSurroundingMessages: getSurroundingMessages
