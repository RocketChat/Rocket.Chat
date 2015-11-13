Template.message.helpers
	actions: ->
		return RocketChat.MessageAction.getButtons(this)

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
		return

	body: ->
		messageType = RocketChat.MessageTypes.getType(this)
		if messageType?.render?
			return messageType.render(message)
		else if messageType?.template?
			# render template
		else if messageType?.message?
			if messageType.data?(this)?
				return TAPi18n.__(messageType.message, messageType.data(this))
			else
				return TAPi18n.__(messageType.message)
		else
			if this.u?.username is RocketChat.settings.get('Chatops_Username')
				this.html = this.msg
				message = RocketChat.callbacks.run 'renderMentions', this
				# console.log JSON.stringify message
				return this.html
			this.html = this.msg
			if _.trim(this.html) isnt ''
				this.html = _.escapeHTML this.html
			message = RocketChat.callbacks.run 'renderMessage', this
			# console.log JSON.stringify message
			this.html = message.html.replace /\n/gm, '<br/>'
			return this.html

	system: ->
		if RocketChat.MessageTypes.isSystemMessage(this)
			return 'system'

	edited: -> Template.instance().wasEdited?(@)
	editTime: ->
		return "" unless Template.instance().wasEdited?(@)
		moment(@editedAt).format('LL hh:mma') #TODO profile pref for 12hr/24hr clock?
	editedBy: ->
		return "" unless Template.instance().wasEdited?(@)
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

Template.message.onCreated ->
	@wasEdited = (msg) ->
		msg.editedAt? and not RocketChat.MessageTypes.isSystemMessage(this)

Template.message.onViewRendered = (context) ->
	view = this
	this._domrange.onAttached (domRange) ->
		lastNode = domRange.lastNode()
		if lastNode.previousElementSibling?.dataset?.date isnt lastNode.dataset.date
			$(lastNode).addClass('new-day')
			$(lastNode).removeClass('sequential')
		else if lastNode.previousElementSibling?.dataset?.username isnt lastNode.dataset.username
			$(lastNode).removeClass('sequential')

		if lastNode.nextElementSibling?.dataset?.date is lastNode.dataset.date
			$(lastNode.nextElementSibling).removeClass('new-day')
			$(lastNode.nextElementSibling).addClass('sequential')
		else
			$(lastNode.nextElementSibling).addClass('new-day')
			$(lastNode.nextElementSibling).removeClass('sequential')

		if lastNode.nextElementSibling?.dataset?.username isnt lastNode.dataset.username
			$(lastNode.nextElementSibling).removeClass('sequential')

		ul = lastNode.parentElement
		wrapper = ul.parentElement

		if context.urls?.length > 0 and Template.oembedBaseWidget? and RocketChat.settings.get 'API_Embed'
			if context.u?.username not in RocketChat.settings.get('API_EmbedDisabledFor')?.split(',')
				for item in context.urls
					do (item) ->
						urlNode = lastNode.querySelector('.body a[href="'+item.url+'"]')
						if urlNode?
							$(lastNode.querySelector('.body')).append Blaze.toHTMLWithData Template.oembedBaseWidget, item

		if not lastNode.nextElementSibling?
			if lastNode.classList.contains('own') is true
				view.parentView.parentView.parentView.parentView.parentView.templateInstance?().atBottom = true
			else
				if view.parentView.parentView.parentView.parentView.parentView.templateInstance?().atBottom isnt true
					newMessage = view.parentView.parentView.parentView.parentView.parentView.templateInstance?()?.find(".new-message")
					newMessage?.className = "new-message"
