@menu = new class
	init: ->
		@container = $("#rocket-chat")
		console.log 'init'

	isOpen: ->
		return @container?.hasClass("menu-opened") is true

	open: ->
		if not @isOpen()
			@container?.removeClass("menu-closed").addClass("menu-opened")
			if Meteor.isCordova
				StatusBar.hide()

	close: ->
		if @isOpen()
			@container?.removeClass("menu-opened").addClass("menu-closed")
			if Meteor.isCordova
				Meteor.setTimeout ->
					StatusBar.show()
				, 300

	toggle: ->
		if @isOpen()
			@close()
		else
			@open()