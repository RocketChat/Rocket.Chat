Template.appLayout.helpers
	flexOpened: ->
		return 'flex-opened' if Session.equals('flexOpened', true)

Template.appLayout.rendered = ->
	$('html').addClass("noscroll").removeClass "scroll"
	# RTL Support - Need config option on the UI
	# $('html').addClass("rtl")
