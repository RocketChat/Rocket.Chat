#TODO how to share this between Template.message.helpers and Template.message.onViewRendered?
isSystem = (msg) ->
	msg.t in ['s', 'p', 'f', 'r', 'au', 'ru', 'ul', 'wm', 'uj', 'rm']
newDayClass = 'new-day'
seqClass = 'sequential'
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
		switch this.t
			when 'r'  then t('Room_name_changed', { room_name: this.msg })
			when 'au' then t('User_added_by', { user_added: this.msg })
			when 'ru' then t('User_removed_by', { user_removed: this.msg })
			when 'ul' then t('User_left', { user_left: this.u.username })
			when 'uj' then t('User_joined_channel', { user: this.u.username })
			when 'wm' then t('Welcome', { user: this.u.username })
			when 'rm' then t('Message_removed', { user: this.u.username })
			when 'rtc' then RocketChat.callbacks.run 'renderRtcMessage', this
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

	createdVia: -> if @via? then "message-via-#{@via}" else ""
	createdViaMe: -> @via is "me"
	system: -> 'system' if Template.instance().isSystem?(@)
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
	@isSystem = (msg) -> isSystem(msg)
	@wasEdited = (msg) -> msg.editedAt? and not isSystem(msg)

Template.message.onViewRendered = (context) ->
	view = this
	this._domrange.onAttached (domRange) ->
		lastNode = domRange.lastNode()
		nextNode = lastNode.nextElementSibling
		currentData = lastNode.dataset
		previousData = lastNode.previousElementSibling?.dataset
		if previousData?.date isnt currentData.date
			$(lastNode)
				.addClass(newDayClass)
				.removeClass(seqClass)
		else if previousData?.username isnt currentData.username
			$(lastNode).removeClass(seqClass)

		if previousData?.date is currentData.date
			$(nextNode)
				.removeClass(newDayClass)
				.addClass(seqClass)
		else
			$(nextNode)
				.addClass(newDayClass)
				.removeClass(seqClass)

		if previousData?.username isnt currentData.username
			$(nextNode).removeClass(seqClass)

		if isSystem {t: currentData.messageType}
			$(lastNode).removeClass(seqClass)
		else if isSystem {t: previousData?.messageType }
			$(lastNode).removeClass(seqClass)

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
