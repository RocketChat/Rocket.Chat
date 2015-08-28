@menu = new class
	init: ->
		@container = $("#rocket-chat")

	isOpen: ->
		return @container?.hasClass("menu-opened") is true

	open: ->
		if not @isOpen()
			@container?.removeClass("menu-closed").addClass("menu-opened")

	close: ->
		if @isOpen()
			@container?.removeClass("menu-opened").addClass("menu-closed")

	toggle: ->
		if @isOpen()
			@close()
		else
			@open()