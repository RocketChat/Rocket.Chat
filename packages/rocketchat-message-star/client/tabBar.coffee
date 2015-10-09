Meteor.startup ->
	RocketChat.callbacks.add 'enter-room', ->
		RocketChat.TabBar.addButton({ id: 'starred-messages', i18nTitle: 'Starred_Messages', icon: 'icon-star', template: 'starredMessages', order: 3 })
	, RocketChat.callbacks.priority.MEDIUM, 'enter-room-tabbar-star'
