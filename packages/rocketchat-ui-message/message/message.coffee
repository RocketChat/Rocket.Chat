Template.message.helpers
	isBot: ->
		return 'bot' if this.bot?
	own: ->
		return 'own' if this.u?._id is Meteor.userId()
	chatops: ->
		return 'chatops-message' if this.u?.username is RocketChat.settings.get('Chatops_Username')
	time: ->
		return moment(this.ts).format('HH:mm')
	date: ->
		return moment(this.ts).format('LL')
	isTemp: ->
		if @temp is true
			return 'temp'
	body: ->
		return Template.instance().body

	system: ->
		if RocketChat.MessageTypes.isSystemMessage(this)
			return 'system'

	edited: ->
		return Template.instance().wasEdited

	editTime: ->
		if Template.instance().wasEdited
			return moment(@editedAt).format('LL hh:mma') #TODO profile pref for 12hr/24hr clock?
	editedBy: ->
		return "" unless Template.instance().wasEdited
		# try to return the username of the editor,
		# otherwise a special "?" character that will be
		# rendered as a special avatar
		return @editedBy?.username or "?"
	pinned: ->
		return this.pinned
	canEdit: ->
		hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', this.rid)
		isEditAllowed = RocketChat.settings.get 'Message_AllowEditing'
		editOwn = this.u?._id is Meteor.userId()

		return unless hasPermission or (isEditAllowed and editOwn)

		blockEditInMinutes = RocketChat.settings.get 'Message_AllowEditing_BlockEditInMinutes'
		if blockEditInMinutes? and blockEditInMinutes isnt 0
			msgTs = moment(this.ts) if this.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			return currentTsDiff < blockEditInMinutes
		else
			return true

	canDelete: ->
		if RocketChat.authz.hasAtLeastOnePermission('delete-message', this.rid )
			return true

		return RocketChat.settings.get('Message_AllowDeleting') and this.u?._id is Meteor.userId()
	canPin: ->
		return RocketChat.settings.get 'Message_AllowPinning'
	canStar: ->
		return RocketChat.settings.get 'Message_AllowStarring'
	showEditedStatus: ->
		return RocketChat.settings.get 'Message_ShowEditedStatus'
	label: ->
		if @i18nLabel
			return t(@i18nLabel)
		else if @label
			return @label

	hasOembed: ->
		return false unless this.urls?.length > 0 and Template.oembedBaseWidget? and RocketChat.settings.get 'API_Embed'

		return false unless this.u?.username not in RocketChat.settings.get('API_EmbedDisabledFor')?.split(',')

		return true

Template.message.onCreated ->
	msg = Template.currentData()

	@wasEdited = msg.editedAt? and not RocketChat.MessageTypes.isSystemMessage(msg)

	@body = do ->
		messageType = RocketChat.MessageTypes.getType(msg)
		if messageType?.render?
			return messageType.render(message)
		else if messageType?.template?
			# render template
		else if messageType?.message?
			if messageType.data?(msg)?
				return TAPi18n.__(messageType.message, messageType.data(msg))
			else
				return TAPi18n.__(messageType.message)
		else
			if msg.u?.username is RocketChat.settings.get('Chatops_Username')
				msg.html = msg.msg
				message = RocketChat.callbacks.run 'renderMentions', msg
				# console.log JSON.stringify message
				return msg.html

			msg.html = msg.msg
			if _.trim(msg.html) isnt ''
				msg.html = _.escapeHTML msg.html

			message = RocketChat.callbacks.run 'renderMessage', msg
			# console.log JSON.stringify message
			msg.html = message.html.replace /\n/gm, '<br/>'
			return msg.html

Template.message.onViewRendered = (context) ->
	view = this
	this._domrange.onAttached (domRange) ->
		lastNode = domRange.lastNode()
		if lastNode.previousElementSibling?.dataset?.date isnt lastNode.dataset.date
			$(lastNode).addClass('new-day')
			$(lastNode).removeClass('sequential')
		else if lastNode.previousElementSibling?.dataset?.bot is 'bot' or lastNode.previousElementSibling?.dataset?.username isnt lastNode.dataset.username
			$(lastNode).removeClass('sequential')

		if lastNode.nextElementSibling?.dataset?.date is lastNode.dataset.date
			$(lastNode.nextElementSibling).removeClass('new-day')
			$(lastNode.nextElementSibling).addClass('sequential')
		else
			$(lastNode.nextElementSibling).addClass('new-day')
			$(lastNode.nextElementSibling).removeClass('sequential')

		if lastNode.nextElementSibling?.dataset?.bot is 'bot' or lastNode.nextElementSibling?.dataset?.username isnt lastNode.dataset.username
			$(lastNode.nextElementSibling).removeClass('sequential')

		if not lastNode.nextElementSibling?
			if lastNode.classList.contains('own') is true
				view.parentView.parentView.parentView.parentView.parentView.templateInstance?().atBottom = true
			else
				if view.parentView.parentView.parentView.parentView.parentView.templateInstance?().atBottom isnt true
					newMessage = view.parentView.parentView.parentView.parentView.parentView.templateInstance?()?.find(".new-message")
					newMessage?.className = "new-message"
