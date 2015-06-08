Meteor.startup ->
	UserPresence.awayTime = 300000
	UserPresence.start()

	Session.setDefault('AvatarRandom', 0)

	window.lastMessageWindow = {}
	window.lastMessageWindowHistory = {}

	@defaultUserLanguage = ->
		lng = window.navigator.userLanguage || window.navigator.language || 'en'

		# Fix browsers having all-lowercase language settings eg. pt-br, en-us
		re = /([a-z]{2}-)([a-z]{2})/
		if re.test lng
			lng = lng.replace re, (match, parts...) -> return parts[0] + parts[1].toUpperCase()
		return lng

	if localStorage.getItem("userLanguage")
		userLanguage = localStorage.getItem("userLanguage")
	else
		userLanguage = defaultUserLanguage()

	localStorage.setItem("userLanguage", userLanguage)
	userLanguage = userLanguage.split('-').shift()
	TAPi18n.setLanguage(userLanguage)
	moment.locale(userLanguage)

	Meteor.users.find({}, { fields: { name: 1, username: 1, pictures: 1, status: 1, emails: 1, phone: 1, services: 1 } }).observe
		added: (user) ->
			Session.set('user_' + user.username + '_status', user.status)

			# UserAndRoom.insert({ type: 'u', uid: user._id, username: user.username, name: user.name})
		changed: (user) ->
			Session.set('user_' + user.username + '_status', user.status)

			# UserAndRoom.update({ uid: user._id }, { $set: { username: user.username, name: user.name } })
		removed: (user) ->
			Session.set('user_' + user.username + '_status', null)

			# UserAndRoom.remove({ uid: user._id })

	# ChatRoom.find({ t: { $ne: 'd' } }, { fields: { t: 1, name: 1 } }).observe
	# 	added: (room) ->
	# 		roomData = { type: 'r', t: room.t, rid: room._id, name: room.name }

	# 		UserAndRoom.insert(roomData)
	# 	changed: (room) ->
	# 		UserAndRoom.update({ rid: room._id }, { $set: { t: room.t, name: room.name } })
	# 	removed: (room) ->
	# 		UserAndRoom.remove({ rid: room._id })

	Tracker.autorun ->
		ChatRoom.find().observe
			added: (data) ->
				Session.set('roomData' + data._id, data)
			changed: (data) ->
				# @TODO alterar a sessão adiciona uma reatividade talvez desnecessária, avaliar melhor
				Session.set('roomData' + data._id, data)
			removed: (data) ->
				Session.set('roomData' + data._id, undefined)

	ChatSubscription.find({}, { fields: { unread: 1 } }).observeChanges
		changed: (id, fields) ->
			if fields.unread and fields.unread > 0

				# @TODO testar se não é a sala aberta atual e fazer funcionar (não tenho mais os dados da msg)
				# KonchatNotification.showDesktop(roomData, self.data.uid + ': ' + self.data.msg)

				KonchatNotification.newMessage()

	Tracker.autorun ->
		unreadCount = 0
		subscriptions = ChatSubscription.find({}, { fields: { unread: 1 } })
		(unreadCount += r.unread) for r in subscriptions.fetch()

		rxFavico.set 'type', 'warn'
		rxFavico.set 'count', unreadCount

		if unreadCount > 0
			document.title = '(' + unreadCount + ') Rocket.Chat'
		else
			document.title = 'Rocket.Chat'

	# Add ascii support to emojione
	emojione?.ascii = true
