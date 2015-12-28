roomFiles = new Mongo.Collection 'room_files'

Template.uploadedFilesList.helpers
	files: ->
		return roomFiles.find({ rid: @rid }).fetch()

	hasFiles: ->
		return roomFiles.find({ rid: @rid }).count() > 0

	hasMore: ->
		return Template.instance().hasMore.get()

	getFileIcon: (type) ->
		if type.match(/^image\/.+$/)
			return 'icon-picture'

		return 'icon-docs'

	customClassForFileType: ->
		if @type.match(/^image\/.+$/)
			return 'room-files-swipebox'

	escapedName: ->
		return s.escapeHTML @name

Template.uploadedFilesList.events
	'click .room-file-item': (e, t) ->
		if $(e.currentTarget).siblings('.icon-picture').length
			e.preventDefault()

	'scroll .content': _.throttle (e, t) ->
		if e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight
			t.limit.set(t.limit.get() + 50)
	, 200

Template.uploadedFilesList.onCreated ->
	rid = Template.currentData().rid
	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 50
	@autorun =>
		@subscribe 'roomFiles', rid, @limit.get(), =>
			if roomFiles.find({ rid: rid }).fetch().length < @limit.get()
				@hasMore.set false

Template.uploadedFilesList.onRendered ->
	$('.room-files-swipebox').swipebox()
