Template.appLayout.helpers
	flexOpened: ->
		return 'flex-opened' if Session.equals('flexOpened', true)

Template.appLayout.rendered = ->
	$('html').addClass("noscroll").addClass("rtl").removeClass "scroll"
