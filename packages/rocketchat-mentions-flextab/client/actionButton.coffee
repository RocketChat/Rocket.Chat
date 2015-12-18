Meteor.startup ->
	RocketChat.MessageAction.addButton
		id: 'jump-to-message'
		icon: 'icon-right-hand'
		i18nLabel: 'Jump_to_message'
		action: (event, instance) ->
			message = @_arguments[1]
			$('.message-dropdown:visible').hide()
			if ChatMessage.findOne message._id
				wrapper = $('.messages-box .wrapper')
				msgElement = $("##{message._id}", wrapper)
				pos = wrapper.scrollTop() + msgElement.offset().top - wrapper.height()/2
				wrapper.animate({
					scrollTop: pos
				}, 500)
			else
				instance.atBottom = false
				RoomHistoryManager.isLoading(message.rid, true)
				ChatMessage.remove {}
				ChatMessage.upsert { _id: message._id }, message
				RoomHistoryManager.hasMoreNext(message.rid, true)
				RoomHistoryManager.getMore(message.rid, 25, false)
				RoomHistoryManager.getMoreNext(message.rid, 25, false)

				typeName = undefined
				subscription = ChatSubscription.findOne rid: message.rid
				if subscription?
					typeName = subscription.t + subscription.name
				else
					curRoomDoc = ChatRoom.findOne(_id: message.rid)
					typeName = curRoomDoc?.t + curRoomDoc?.name

				RoomManager.updateMentionsMarksOfRoom typeName

				Tracker.afterFlush ->
					wrapper = $('.messages-box .wrapper')
					msgElement = $("##{message._id}", wrapper)
					pos = wrapper.scrollTop() + msgElement.offset().top - wrapper.height()/2
					wrapper.animate({
						scrollTop: pos
					}, 500)

					RoomHistoryManager.isLoading(message.rid, false)

				# Meteor.call 'loadHistory', message.rid, message.ts, 25, (err, result) ->
				# 	throw err if err
				# 	ChatMessage.upsert {_id: item._id}, item for item in result?.messages or [] when item.t isnt 'command'

				# 	Meteor.call 'loadNextMessages', message.rid, message.ts, 25, (err, result) ->
				# 		throw err if err
				# 		ChatMessage.upsert {_id: item._id}, item for item in result?.messages or [] when item.t isnt 'command'

				# 		typeName = undefined
				# 		subscription = ChatSubscription.findOne rid: message.rid
				# 		if subscription?
				# 			typeName = subscription.t + subscription.name
				# 		else
				# 			curRoomDoc = ChatRoom.findOne(_id: message.rid)
				# 			typeName = curRoomDoc?.t + curRoomDoc?.name
				# 		RoomManager.updateMentionsMarksOfRoom typeName

				#

				# 		Tracker.afterFlush ->
				# 			wrapper = $('.messages-box .wrapper')
				# 			msgElement = $("##{message._id}", wrapper)
				# 			pos = wrapper.scrollTop() + msgElement.offset().top - wrapper.height()/2

				# 			wrapper.animate({
				# 				scrollTop: pos
				# 			}, 500)

				# 			instance.showJumpToRecent?.set true
				# 			RoomHistoryManager.isLoading(message.rid, false)

		validation: (message) ->
			return message.mentionedList is true

		order: 100
