Meteor.startup ->
	RocketChat.callbacks.add 'enter-room', ->
		RocketChat.TabBar.addButton({ id: 'mentions', i18nTitle: 'Mentions', icon: 'icon-at', template: 'mentionsFlexTab', order: 3 })
	, RocketChat.callbacks.priority.MEDIUM, 'enter-room-tabbar-mentions'
