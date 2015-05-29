Template.chatMessageDashboard.helpers
	own: ->
		return 'own' if this.data.uid is Meteor.userId()

	username: ->
		if this.uid?
			return Session.get('user_' + this.uid + '_name')

	isSystemMessage: ->
		return this.t in ['s', 'p', 'f', 'r', 'au', 'ru', 'ul', 'nu', 'wm']

	isEditing: ->
		return this._id is Session.get('editingMessageId')

	message: (preventAutoLinker) ->
		if this.by
			UserManager.addUser(this.by)
		else if this.uid
			UserManager.addUser(this.uid)
		switch this.t
			when 'p' then "<i class='icon-link-ext'></i><a href=\"#{this.url}\" target=\"_blank\">#{this.msg}</a>"
			when 'r' then t('chatMessageDashboard.Room_name_changed', this.msg, Session.get('user_' + this.by + '_name')) + '.'
			when 'au' then t('chatMessageDashboard.User_added_by', this.msg, Session.get('user_' + this.by + '_name'))
			when 'ru' then t('chatMessageDashboard.User_removed_by', this.msg, Session.get('user_' + this.by + '_name'))
			when 'ul' then t('chatMessageDashboard.User_left', this.msg)
			when 'nu' then t('chatMessageDashboard.User_added', this.msg)
			when 'wm' then t('chatMessageDashboard.Welcome', this.msg)
			else
				if preventAutoLinker? 
					return this.msg
				else
					return Autolinker.link(_.stripTags(this.msg), { stripPrefix: false })

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

Template.chatMessageDashboard.events
	'mousedown .edit-message': ->
		self = this
		Session.set 'editingMessageId', undefined
		Meteor.defer ->
			Session.set 'editingMessageId', self._id

			Meteor.defer ->
				$('.input-message-editing').select()

Template.chatMessageDashboard.onRendered ->
	chatMessages = $('.messages-box .wrapper')
	message = $(this.firstNode)

	if message.data('scroll-to-bottom')?
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
