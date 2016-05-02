Template.message.helpers

	own: ->
		return 'own' if this.u?._id is Meteor.userId()

	time: ->
		return moment(this.ts).format('LT')

	date: ->
		return moment(this.ts).format('LL')

	isTemp: ->
		if @temp is true
			return 'temp'
		return

	error: ->
		return 'msg-error' if @error

	body: ->
		switch this.t
			when 'r'  then t('Room_name_changed', { room_name: this.msg, user_by: this.u.username })
			when 'au' then t('User_added_by', { user_added: this.msg, user_by: this.u.username })
			when 'ru' then t('User_removed_by', { user_removed: this.msg, user_by: this.u.username })
			when 'ul' then tr('User_left', { context: this.u.gender }, { user_left: this.u.username })
			when 'uj' then tr('User_joined_channel', { context: this.u.gender }, { user: this.u.username })
			when 'wm' then t('Welcome', { user: this.u.username })
			when 'livechat-close' then t('Conversation_finished')
			# when 'rtc' then RocketChat.callbacks.run 'renderRtcMessage', this
			else
				this.html = this.msg
				if s.trim(this.html) isnt ''
					this.html = s.escapeHTML this.html
				# message = RocketChat.callbacks.run 'renderMessage', this
				message = this
				this.html = message.html.replace /\n/gm, '<br/>'
				return this.html

	system: ->
		return 'system' if this.t in ['s', 'p', 'f', 'r', 'au', 'ru', 'ul', 'wm', 'uj', 'livechat-close']


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

		if context.urls?.length > 0 and Template.oembedBaseWidget?
			for item in context.urls
				do (item) ->
					urlNode = lastNode.querySelector('.body a[href="'+item.url+'"]')
					if urlNode?
						$(urlNode).replaceWith Blaze.toHTMLWithData Template.oembedBaseWidget, item

		if not lastNode.nextElementSibling?
			if lastNode.classList.contains('own') is true
				view.parentView.parentView.parentView.parentView.parentView.templateInstance().atBottom = true
			else
				if view.parentView.parentView.parentView.parentView.parentView.templateInstance().atBottom isnt true
					newMessage = document.querySelector(".new-message")
					newMessage.className = "new-message"
