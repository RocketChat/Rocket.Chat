@menu = new class
	init: ->
		@mainContent = $('.main-content')
		@list = $('.rooms-list')

		Session.set("isMenuOpen", false)

	isOpen: ->
		return Session.get("isMenuOpen")

	open: ->
		Session.set("isMenuOpen", true)
		if isRtl localStorage.getItem "userLanguage"
			@mainContent?.css('transform', 'translateX(-260px)')
		else
			@mainContent?.css('transform', 'translateX(260px)')

	close: ->
		Session.set("isMenuOpen", false)
		@mainContent?.css('transform', 'translateX(0)')

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
