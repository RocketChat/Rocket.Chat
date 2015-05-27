Template.messagePopup.onCreated ->
	this.onKeyUp = (event) =>
		if event.which is 38
			this.up()
		else if event.which is 40
			this.down()
		else
			Meteor.defer =>
				this.verifySelection()

	$('body').on 'keyup', this.onKeyUp

	this.index = 0

	this.up = =>
		current = this.find('.popup-item.selected')
		previous = current.previousElementSibling or this.find('.popup-item:last-child')
		if previous?
			current.className = current.className.replace /\sselected/, ''
			previous.className += ' selected'
			this.data.value.set previous.getAttribute('data-id')

	this.down = =>
		current = this.find('.popup-item.selected')
		next = current.nextElementSibling or this.find('.popup-item')
		if next?
			current.className = current.className.replace /\sselected/, ''
			next.className += ' selected'
			this.data.value.set next.getAttribute('data-id')

	this.verifySelection = =>
		current = this.find('.popup-item.selected')
		if not current?
			first = this.find('.popup-item')
			if first?
				first.className += ' selected'
				this.data.value.set first.getAttribute('data-id')


Template.messagePopup.onDestroyed ->
	$('body').off 'keyup', this.onKeyUp


Template.messagePopup.events
	'mouseenter .popup-item': (e) ->
		if e.currentTarget.className.indexOf('selected') > -1
			return

		template = Template.instance()

		current = template.find('.popup-item.selected')
		if current?
			current.className = current.className.replace /\sselected/, ''
		e.currentTarget.className += ' selected'
		template.data.value.set this._id

	'click .popup-item': (e) ->
		template = Template.instance()

		template.data.value.set this._id

		template.data.open.set false
