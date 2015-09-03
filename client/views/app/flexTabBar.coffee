Template.flexTabBar.events
	"click .member-list": (event, t) ->
		if (Session.get('flexOpened'))
			Session.set('rtcLayoutmode', 0)
			Session.set('flexOpened',false)
			t.searchResult.set undefined
		else
			Session.set('flexOpened', true)
