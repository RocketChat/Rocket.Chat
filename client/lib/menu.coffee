@menu = new class
	init: ->
		@container = $("#rocket-chat")
		@list = $('.rooms-list')

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

	updateUnreadBars: _.throttle ->
		if not @list?
			return

		listOffset = @list.offset()
		listHeight = @list.height()

		showTop = false
		showBottom = false
		$('li.has-alert').each ->
			if $(this).offset().top < listOffset.top - $(this).height()
				showTop = true

			if $(this).offset().top > listOffset.top + listHeight
				showBottom = true

		if showTop is true
			$('.top-unread-rooms').removeClass('hidden')
		else
			$('.top-unread-rooms').addClass('hidden')

		if showBottom is true
			$('.bottom-unread-rooms').removeClass('hidden')
		else
			$('.bottom-unread-rooms').addClass('hidden')
	, 200
