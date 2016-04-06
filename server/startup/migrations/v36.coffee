url = Npm.require 'url'
RocketChat.Migrations.add
	version: 36
	up: ->
		loginHeader = RocketChat.models.Settings.findOne _id: 'Layout_Login_Header'

		if not loginHeader?.value?
			return

		match = loginHeader.value.match(/<img\ssrc=['"]([^'"]+)/)
		if match? and match.length is 2
			requestUrl = match[1]
			if requestUrl[0] is '/'
				requestUrl = url.resolve(Meteor.absoluteUrl(), requestUrl)

			try
				Meteor.startup ->
					Meteor.setTimeout ->
						result = HTTP.get requestUrl, npmRequestOptions: {encoding: 'binary'}
						if result.statusCode is 200
							RocketChat.Assets.setAsset(result.content, result.headers['content-type'], 'logo')
					, 30000
			catch e
				console.log e


		RocketChat.models.Settings.remove _id: 'Layout_Login_Header'

		files = RocketChat.__migration_assets_files = new Mongo.Collection('assets.files')
		chunks = RocketChat.__migration_assets_chunks = new Mongo.Collection('assets.chunks')
		list = {
			'favicon.ico': 'favicon_ico'
			'favicon.svg': 'favicon'
			'favicon_64.png': 'favicon_64'
			'favicon_96.png': 'favicon_96'
			'favicon_128.png': 'favicon_128'
			'favicon_192.png': 'favicon_192'
			'favicon_256.png': 'favicon_256'
		}

		for from, to of list
			newFile = files.findOne({_id: to})
			if not newFile?
				oldFile = files.findOne({_id: from})
				if oldFile?
					oldFile._id = to
					oldFile.filename = to
					files.insert(oldFile)
					files.remove({_id: from})
					chunks.update({files_id: from}, {$set: {files_id: to}}, {multi: true})

