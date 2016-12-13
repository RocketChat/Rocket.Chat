Template.roomNotFound.helpers
	data: ->
		return Session.get 'roomNotFound'

	name: ->
		return Blaze._escape(this.name)
