Template.chatMessageDashboard.helpers
	own: ->
		return 'own' if this.data.u?._id is Meteor.userId()

	username: ->
		return this.u.username

	messageDate: (date) ->
		return moment(date).format('LL')

	isSystemMessage: ->
		return this.t in ['s', 'p', 'f', 'r', 'au', 'ru', 'ul', 'nu', 'wm']

	isEditing: ->
		return this._id is Session.get('editingMessageId')

	preProcessingMessage: ->
		this.html = this.msg
		if _.trim(this.html) isnt ''
			this.html = _.escapeHTML this.html
		message = RocketChat.callbacks.run 'renderMessage', this
		this.html = message.html.replace /\n/gm, '<br/>'
		return this.html

	message: ->
		switch this.t
			when 'r' then t('chatMessageDashboard.Room_name_changed', { room_name: this.msg, user_by: Session.get('user_' + this.u._id + '_name') }) + '.'
			when 'au' then t('chatMessageDashboard.User_added_by', { user_added: this.msg, user_by: Session.get('user_' + this.u._id + '_name') })
			when 'ru' then t('chatMessageDashboard.User_removed_by', { user_removed: this.msg, user_by: Session.get('user_' + this.u._id + '_name') })
			when 'ul' then t('chatMessageDashboard.User_left', this.msg)
			when 'nu' then t('chatMessageDashboard.User_added', this.msg)
			when 'wm' then t('chatMessageDashboard.Welcome', this.msg)
			else this.msg

	time: ->
		return moment(this.ts).format('HH:mm')

	newMessage: ->
		# @TODO pode melhorar, acho que colocando as salas abertas na sessão
		# if $('#chat-window-' + this.rid + '.opened').length == 0
		# 	return 'new'

	preMD: Template 'preMD', ->
		self = this
		text = ""
		if self.templateContentBlock
			text = Blaze._toText(self.templateContentBlock, HTML.TEXTMODE.STRING)

		text = text.replace(/#/g, '\\#')
		return text

	getPupupConfig: ->
		template = Template.instance()
		return {
			getInput: ->
				return template.find('.input-message-editing')
		}

Template.chatMessageDashboard.events
	'mousedown .edit-message': ->
		self = this
		Session.set 'editingMessageId', undefined
		Meteor.defer ->
			Session.set 'editingMessageId', self._id

			Meteor.defer ->
				$('.input-message-editing').select()

	'click .mention-link': (e) ->
		Session.set('flexOpened', true)
		Session.set('showUserInfo', $(e.currentTarget).data('username'))

Template.chatMessageDashboard.onRendered ->
	chatMessages = $('.messages-box .wrapper')
	message = $(this.firstNode)

	if this.data.scroll? and message.data('scroll-to-bottom')?
		if message.data('scroll-to-bottom') and (this.parentTemplate().scrollOnBottom or this.data.data.uid is Meteor.userId())
			chatMessages.stop().animate({scrollTop: 99999}, 1000 )
		else
			# senao, exibe o alerta de mensagem  nova
			$('.new-message').removeClass('not')
	else
		if not chatMessages.data('previous-height')
			chatMessages.stop().scrollTop(99999)
		else
			chatMessages.stop().scrollTop(chatMessages.get(0).scrollHeight - chatMessages.data('previous-height'))
