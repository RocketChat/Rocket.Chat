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
	files = [].concat files

	consume = ->
		file = files.pop()
		if not file?
			swal.close()
			return

		readAsDataURL file.file, (fileContent) ->
			text = ''

			if file.type is 'audio'
				text = """
					<div class='upload-preview'>
						<audio  style="width: 100%;" controls="controls">
							<source src="#{fileContent}" type="audio/wav">
							Your browser does not support the audio element.
						</audio>
					</div>
					<div class='upload-preview-title'>#{file.name}</div>
				"""
			else
				text = """
					<div class='upload-preview'>
						<div class='upload-preview-file' style='background-image: url(#{fileContent})'></div>
					</div>
					<div class='upload-preview-title'>#{file.name}</div>
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
					# // Prepare the file to insert in database, note that we don't provide an URL,
					# // it will be set automatically by the uploader when file transfer is complete.
					record =
						name: file.name or file.file.name
						size: file.file.size
						type: file.file.type

					# // Create a new Uploader for this file
					upload = new UploadFS.Uploader
						# // This is where the uploader will save the file
						store: Meteor.fileStore
						# // The file data
						data: data
						# // The document to save in the collection
						file: record
						# // The error callback
						onError: (err) ->
							console.error(err)
						# // The complete callback
						onComplete: (file) ->
							console.log('transfer complete', arguments)
							toastr.success 'Upload succeeded!'
							Meteor.call 'sendMessage',
								_id: Random.id()
								rid: Session.get('openedRoom')
								msg: """
									File Uploaded: *#{file.name}*
									#{file.url}
								"""
								file:
									_id: file._id

					# // Reactive method to get upload progress
					Tracker.autorun ->
						console.log((upload.getProgress() * 100) + '% completed')

					# // Reactive method to get upload status
					Tracker.autorun ->
						console.log('transfer ' + (upload.isUploading() ? 'started' : 'stopped'))

					# // Starts the upload
					upload.start();

					# // Stops the upload
					# upload.stop();

					# // Abort the upload
					# upload.abort();

				# newFile = new (FS.File)(file.file)
				# if file.name?
				# 	newFile.name(file.name)
				# newFile.rid = Session.get('openedRoom')
				# newFile.recId = Random.id()
				# newFile.userId = Meteor.userId()
				# Files.insert newFile, (error, fileObj) ->
				# 	unless error
				# 		toastr.success 'Upload succeeded!'

	consume()