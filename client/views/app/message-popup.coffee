Template.messagePopup.onCreated ->

	this.textFilter = new ReactiveVar ''

	this.open = new ReactiveVar false

	this.value = new ReactiveVar

	this.up = =>
		current = this.find('.popup-item.selected')
		previous = current.previousElementSibling or this.find('.popup-item:last-child')
		if previous?
			current.className = current.className.replace /\sselected/, ''
			previous.className += ' selected'
			this.value.set previous.getAttribute('data-id')

	this.down = =>
		current = this.find('.popup-item.selected')
		next = current.nextElementSibling or this.find('.popup-item')
		if next?
			current.className = current.className.replace /\sselected/, ''
			next.className += ' selected'
			this.value.set next.getAttribute('data-id')

	this.verifySelection = =>
		current = this.find('.popup-item.selected')
		if not current?
			first = this.find('.popup-item')
			if first?
				first.className += ' selected'
				this.value.set first.getAttribute('data-id')

	this.onInputKeydown = (event) =>
		if event.which is 13 and this.open.curValue is true
			this.open.set false
			this.input.value = this.input.value.replace /@[A-Za-z0-9-_]*$/, '@' + this.value.curValue + ' '
			event.preventDefault()
			event.stopPropagation()

	this.onInputKeyup = (event) =>
		if event.which is 38
			this.up()
		else if event.which is 40
			this.down()
		else
			Meteor.defer =>
				this.verifySelection()

		if /@[A-Za-z0-9-_]*$/.test this.input.value
			this.textFilter.set(this.input.value.match(/@([A-Za-z0-9-_]*)$/)[1])
			this.open.set true
		else
			this.open.set false


Template.messagePopup.onRendered ->
	this.input = this.data.getInput?()
	$(this.input).on 'keyup', this.onInputKeyup
	$(this.input).on 'keydown', this.onInputKeydown


Template.messagePopup.onDestroyed ->
	$(this.input).off 'keyup', this.onInputKeyup
	$(this.input).off 'keydown', this.onInputKeydown


Template.messagePopup.events
	'mouseenter .popup-item': (e) ->
		if e.currentTarget.className.indexOf('selected') > -1
			return

		template = Template.instance()

		current = template.find('.popup-item.selected')
		if current?
			current.className = current.className.replace /\sselected/, ''
		e.currentTarget.className += ' selected'
		template.value.set this._id

	'click .popup-item': (e) ->
		template = Template.instance()

		template.value.set this._id

		template.open.set false


Template.messagePopup.helpers
	isOpen: ->
		Template.instance().open.get()

	data: ->
		template = Template.instance()
		filter = template.textFilter.get()
		return template.data.getFilter template.data.collection, filter
