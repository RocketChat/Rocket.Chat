Template.messagePopup.onCreated ->
	console.log arguments
	console.log this
	$('body').on 'keyup', (event) =>
		if event.which is 38
			this.up()
		else if event.which is 40
			this.down()

	this.index = 0

	this.up = =>
		current = this.find('.popup-item.selected')
		previous = current.previousElementSibling or this.find('.popup-item:last-child')
		if previous?
			current.className = current.className.replace /\sselected/, ''
			previous.className += ' selected'
			this.data.value.set Meteor.users.findOne previous.getAttribute('data-id')

	this.down = =>
		current = this.find('.popup-item.selected')
		next = current.nextElementSibling or this.find('.popup-item')
		if next?
			current.className = current.className.replace /\sselected/, ''
			next.className += ' selected'
			this.data.value.set Meteor.users.findOne next.getAttribute('data-id')


Template.messagePopup.onRendered ->
	window.a = this.find('.popup-item').className += ' selected'


Template.messagePopup.helpers
	users: ->
		return Meteor.users.find()


Template.messagePopup.events
	'mouseenter .popup-item': (e) ->
		if e.currentTarget.className.indexOf('selected') > -1
			return

		template = Template.instance()

		current = template.find('.popup-item.selected')
		if current?
			current.className = current.className.replace /\sselected/, ''
		e.currentTarget.className += ' selected'
		template.data.value.set this
