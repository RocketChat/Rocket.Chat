roomFiles = new Mongo.Collection 'room_files'

Template.uploadedFilesList.helpers
	files: ->
		return roomFiles.find({ rid: @rid }, { sort: { uploadedAt: -1 } }).fetch()

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

	canDelete: ->
		msg = ChatMessage.findOne { file: { _id: @_id } }
		if msg
			return RocketChat.authz.hasAtLeastOnePermission('delete-message', msg.rid) or RocketChat.settings.get('Message_AllowDeleting') and msg.u?._id is Meteor.userId()

Template.uploadedFilesList.events
	'click .room-file-item': (e, t) ->
		if $(e.currentTarget).siblings('.icon-picture').length
			e.preventDefault()

	'click .icon-trash': (e, t) ->
		self = this
		swal {
			title: 'Are you sure?'
			text: 'You will not be able to recover this file.'
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: 'Yes delete it'
			cancelButtonText: 'Cancel'
			closeOnConfirm: false
			html: false
		}, ->
			swal
				title: 'Deleted'
				text: 'Your file has been deleted.'
				type: 'success'
				timer: 1000
				showConfirmButton: false

				msg = ChatMessage.findOne { file: { _id: self._id } }
				fileCollection.remove self._id, () ->
					chatMessages[Session.get('openedRoom')].deleteMsg(msg);

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
