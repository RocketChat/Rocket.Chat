Meteor.startup ->
	RocketChat.callbacks.add 'enter-room', ->
		console.log 'adding tabbar'
		RocketChat.TabBar.addButton({ id: 'starred-messages', i18nTitle: 'rocketchat-message-star:Starred_Messages', icon: 'icon-star', template: 'starredMessages', order: 3 })
	, RocketChat.callbacks.priority.MEDIUM, 'enter-room-tabbar-star'
