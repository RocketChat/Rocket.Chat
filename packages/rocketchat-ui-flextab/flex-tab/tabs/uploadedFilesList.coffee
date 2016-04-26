roomFiles = new Mongo.Collection 'room_files'

Template.uploadedFilesList.helpers
	files: ->
		return roomFiles.find({ rid: @rid }, { sort: { uploadedAt: -1 } })

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
		return RocketChat.authz.hasAtLeastOnePermission('delete-message', @rid) or RocketChat.settings.get('Message_AllowDeleting') and @userId is Meteor.userId()

	url: ->
		return '/file-upload/' + @_id + '/' + @name

Template.uploadedFilesList.events
	'click .room-file-item': (e, t) ->
		if $(e.currentTarget).siblings('.icon-picture').length
			e.preventDefault()

	'click .icon-trash': (e, t) ->
		self = this
		swal {
			title: TAPi18n.__('Are_you_sure')
			text: TAPi18n.__('You_will_not_be_able_to_recover_file')
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: TAPi18n.__('Yes_delete_it')
			cancelButtonText: TAPi18n.__('Cancel')
			closeOnConfirm: false
			html: false
		}, ->
			swal
				title: TAPi18n.__('Deleted')
				text: TAPi18n.__('Your_file_has_been_deleted')
				type: 'success'
				timer: 1000
				showConfirmButton: false

			# Check if the upload message for this file is currently loaded
			msg = ChatMessage.findOne { file: { _id: self._id } }
			RocketChat.models.Uploads.remove self._id, () ->
				if msg
					chatMessages[Session.get('openedRoom')].deleteMsg(msg);
				else
					Meteor.call 'deleteFileMessage', self._id, (error, result) ->
						if error
							return handleError(error)

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
	$('.room-files-swipebox').swipebox({
		hideBarsDelay: 0
	})
