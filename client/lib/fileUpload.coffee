@fileUpload = (files) ->
	files = [].concat files

	consume = ->
		file = files.pop()
		if not file?
			swal.close()
			return

		reader = new FileReader()
		reader.onload = (event) ->
			image = event.target.result
			swal
				title: t('Upload_file_question')
				text: """
					<div class='upload-preview'>
						<div class='upload-preview-file' style='background-image: url(#{image})'></div>
					</div>
					<div class='upload-preview-title'>#{file.name}</div>
				"""
				showCancelButton: true
				closeOnConfirm: false
				closeOnCancel: false
				html: true
			, (isConfirm) ->
				consume()

				if isConfirm isnt true
					return

				newFile = new (FS.File)(file.file)
				if file.name?
					newFile.name(file.name)
				newFile.rid = Session.get('openedRoom')
				newFile.recId = Random.id()
				newFile.userId = Meteor.userId()
				Files.insert newFile, (error, fileObj) ->
					unless error
						toastr.success 'Upload succeeded!'

		reader.readAsDataURL(file.file)

	consume()