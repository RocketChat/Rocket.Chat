Template.burger.helpers
	unread: ->
		return Session.get 'unread'
	isMenuOpen: ->
		if Session.equals('isMenuOpen', true) then 'menu-opened'
