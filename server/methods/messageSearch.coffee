Meteor.methods
	messageSearch: (text, rid, limit) ->
		###
			text = 'from:rodrigo mention:gabriel chat'
		###

		result =
			messages: []
			users: []
			channels: []

		query = {}
		options =
			sort:
				ts: -1
			limit: limit or 20

		# Query for senders
		from = []
		text = text.replace /from:([a-z0-9.-_]+)/ig, (match, username, index) ->
			from.push username
			return ''

		if from.length > 0
			query['u.username'] =
				$regex: from.join('|')
				$options: 'i'


		# Query for mentions
		mention = []
		text = text.replace /mention:([a-z0-9.-_]+)/ig, (match, username, index) ->
			mention.push username
			return ''

		if mention.length > 0
			query['mentions.username'] =
				$regex: mention.join('|')
				$options: 'i'


		# Query in message text
		text = text.trim().replace(/\s\s/g, ' ')
		if text isnt ''
			# Regex search
			if /^\/.+\/[imxs]*$/.test text
				r = text.split('/')
				query.msg =
					$regex: r[1]
					$options: r[2]
			else if RocketChat.settings.get 'Message_AlwaysSearchRegExp'
				query.msg =
					$regex: text
					$options: 'i'
			else
				query.$text =
					$search: text
				options.fields =
					score:
						$meta: "textScore"

			# options.sort =
			# 	score:
			# 		$meta: 'textScore'

		if Object.keys(query).length > 0
			query.t = { $ne: 'rm' } # hide removed messages (userful when searching for user messages)
			query._hidden = { $ne: true } # don't return _hidden messages

			# Filter by room
			if rid?
				query.rid = rid
				try
					if Meteor.call('canAccessRoom', rid, this.userId) isnt false
						if not RocketChat.settings.get 'Message_ShowEditedStatus'
							options.fields = { 'editedAt': 0 }
						result.messages = RocketChat.models.Messages.find(query, options).fetch()


		# make sure we don't return more than limit results
		# limit -= result.messages?.length

		# ###
		# # USERS
		# ###
		# if from.length is 0 and mention.length is 0 and text isnt ''
		# 	query =
		# 		username:
		# 			$regex: text
		# 			$options: 'i'

		# 	options =
		# 		limit: 5
		# 		sort:
		# 			username: 1
		# 		fields:
		# 			username: 1
		# 			name: 1
		# 			status: 1
		# 			utcOffset: 1

		# 	result.users = Meteor.users.find(query, options).fetch()


		# ###
		# # CHANNELS
		# ###
		# if from.length is 0 and mention.length is 0 and text isnt ''
		# 	query =
		# 		t: 'c'
		# 		name:
		# 			$regex: text
		# 			$options: 'i'

		# 	options =
		# 		limit: 5
		# 		sort:
		# 			name: 1
		# 		fields:
		# 			username: 1
		# 			name: 1
		# 			status: 1
		# 			utcOffset: 1

		# 	result.channels = ChatRoom.find(query, options).fetch()

		return result
