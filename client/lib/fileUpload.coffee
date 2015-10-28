readAsDataURL = (file, callback) ->
	reader = new FileReader()
	reader.onload = (ev) ->
		callback ev.target.result, file

	reader.readAsDataURL file

readAsArrayBuffer = (file, callback) ->
	reader = new FileReader()
	reader.onload = (ev) ->
		callback ev.target.result, file

	reader.readAsArrayBuffer file


@fileUpload = (files) ->
	roomId = Session.get('openedRoom')
	files = [].concat files

	consume = ->
		file = files.pop()
		if not file?
			swal.close()
			return

		readAsDataURL file.file, (fileContent) ->
			return unless fileUploadIsValidContentType file.file.type

			text = ''

			if file.type is 'audio'
				text = """
					<div class='upload-preview'>
						<audio  style="width: 100%;" controls="controls">
							<source src="#{fileContent}" type="audio/wav">
							Your browser does not support the audio element.
						</audio>
					</div>
					<div class='upload-preview-title'>#{Handlebars._escape(file.name)}</div>
				"""
			else
				text = """
					<div class='upload-preview'>
						<div class='upload-preview-file' style='background-image: url(#{fileContent})'></div>
					</div>
					<div class='upload-preview-title'>#{Handlebars._escape(file.name)}</div>
				"""

			swal
				title: t('Upload_file_question')
				text: text
				showCancelButton: true
				closeOnConfirm: false
				closeOnCancel: false
				html: true
			, (isConfirm) ->
				consume()

				if isConfirm isnt true
					return

				readAsArrayBuffer file.file, (data) ->
					record =
						name: file.name or file.file.name
						size: file.file.size
						type: file.file.type
						rid: roomId

					upload = new UploadFS.Uploader
						store: Meteor.fileStore
						data: data
						file: record
						onError: (err) ->
							uploading = Session.get 'uploading'
							if uploading?
								item = _.findWhere(uploading, {id: upload.id})
								if item?
									item.error = err.reason
									item.percentage = 0
								Session.set 'uploading', uploading

						onComplete: (file) ->
							self = this
							Meteor.call 'sendMessage', {
								_id: Random.id()
								rid: roomId
								msg: """
									File Uploaded: *#{file.name}*
									#{file.url}
								"""
								file:
									_id: file._id
							}, ->
								Meteor.setTimeout ->
									uploading = Session.get 'uploading'
									if uploading?
										item = _.findWhere(uploading, {id: self.id})
										Session.set 'uploading', _.without(uploading, item)
								, 2000

					upload.id = Random.id()

					# // Reactive method to get upload progress
					Tracker.autorun (c) ->
						uploading = undefined
						cancel = undefined

						Tracker.nonreactive ->
							cancel = Session.get "uploading-cancel-#{upload.id}"
							uploading = Session.get 'uploading'

						if cancel
							return c.stop()

						uploading ?= []

						item = _.findWhere(uploading, {id: upload.id})

						if not item?
							item =
								id: upload.id
								name: upload.getFile().name

							uploading.push item

						item.percentage = Math.round(upload.getProgress() * 100)
						Session.set 'uploading', uploading

					upload.start();

					# upload.stop();

					Tracker.autorun (c) ->
						cancel = Session.get "uploading-cancel-#{upload.id}"
						if cancel
							upload.stop()
							upload.abort()
							c.stop()

							uploading = Session.get 'uploading'
							if uploading?
								item = _.findWhere(uploading, {id: upload.id})
								if item?
									item.percentage = 0
								Session.set 'uploading', uploading

							Meteor.setTimeout ->
								uploading = Session.get 'uploading'
								if uploading?
									item = _.findWhere(uploading, {id: upload.id})
									Session.set 'uploading', _.without(uploading, item)
							, 1000

	consume()
