Template.chatMessageDashboard.helpers
	own: ->
		return 'own' if this.u?._id is Meteor.userId()

	time: ->
		return moment(this.ts).format('HH:mm')

	date: ->
		return moment(this.ts).format('LL')

	message: ->
		switch this.t
			when 'r'  then t('Room_name_changed', { room_name: this.msg, user_by: this.u.username })
			when 'au' then t('User_added_by', { user_added: this.msg, user_by: this.u.username })
			when 'ru' then t('User_removed_by', { user_removed: this.msg, user_by: this.u.username })
			when 'ul' then t('User_left', { user_left: this.u.username })
			when 'nu' then t('User_added', { user_added: this.u.username })
			when 'uj' then t('User_joined_channel', { user: this.u.username })
			when 'wm' then t('Welcome', { user: this.u.username })
			else
				this.html = this.msg
				if _.trim(this.html) isnt ''
					this.html = _.escapeHTML this.html
				message = RocketChat.callbacks.run 'renderMessage', this
				this.html = message.html.replace /\n/gm, '<br/>'
				return this.html

	isSystemMessage: ->
		return this.t in ['s', 'p', 'f', 'r', 'au', 'ru', 'ul', 'nu', 'wm', 'uj']

	isEditing: ->
		return this._id is Session.get('editingMessageId')

	getPupupConfig: ->
		template = Template.instance()
		return {
			getInput: ->
				return template.find('.input-message-editing')
		}

Template.chatMessageDashboard.onRendered ->

	if this.lastNode.previousElementSibling?.dataset?.date isnt this.lastNode.dataset.date
		$(this.lastNode).addClass('new-day')
	else if this.lastNode.previousElementSibling?.dataset?.username is this.lastNode.dataset.username
		$(this.lastNode).addClass('sequential')

	if this.lastNode.nextElementSibling?.dataset?.date is this.lastNode.dataset.date
		$(this.lastNode.nextElementSibling).removeClass('new-day')
	else if this.lastNode.nextElementSibling?.dataset?.username isnt this.lastNode.dataset.username
		$(this.lastNode.nextElementSibling).removeClass('sequential')

	if(this.lastNode.className.match("own"))
		ScrollListener.toBottom(true)
		return

	message = $(this.lastNode)
	parent = message.parent().children().last()
	if message.get(0) is parent.get(0)
		ScrollListener.toBottom(false)
