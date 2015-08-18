@fileUpload = (files) ->
	files = [].concat files

	consume = ->
		file = files.pop()
		if not file?
			swal.close()
			return

		reader = new FileReader()
		reader.onload = (event) ->
			fileContent = event.target.result

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