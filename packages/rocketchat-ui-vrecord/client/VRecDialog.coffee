@VRecDialog = new class
	opened: false
	initiated: false
	width: 400
	height: 280

	init: ->
		if @initiated
			return

		@initiated = true
		Blaze.render(Template.vrecDialog, document.body)

	open: (source) ->
		if not @initiated
			@init()

		@source = source
		dialog = $('.vrec-dialog')
		@setPosition(dialog, source)
		dialog.addClass('show')
		@opened = true

		@initializeCamera()

	close: ->
		$('.vrec-dialog').removeClass('show')
		@opened = false

		if @video?
			VideoRecorder.stop()

	setPosition: (dialog, source) ->
		sourcePos = $(source).offset()
		left = sourcePos.left - @width + 100
		top = sourcePos.top - @height - 40

		left = 10 if left < 0
		top = 10 if top < 0

		dialog.css({ top: top + 'px', left: left + 'px' })

	initializeCamera: ->
		@video = $('.vrec-dialog video').get('0')
		if not @video
			return
		VideoRecorder.start @video
