val = (v, d) ->
	return if v? then v else d

Template.messagePopup.onCreated ->
	template = this

	template.textFilter = new ReactiveVar ''

	template.open = new ReactiveVar false

	template.value = new ReactiveVar

	template.trigger = val(template.data.trigger, '@')

	template.prefix = val(template.data.prefix, template.trigger)

	template.suffix = val(template.data.suffix, ' ')

	template.matchSelectorRegex = val(template.data.matchSelectorRegex, new RegExp "#{template.trigger}[A-Za-z0-9-_]*$")

	template.selectorRegex = val(template.data.selectorRegex, new RegExp "#{template.trigger}([A-Za-z0-9-_]*)$")

	template.replaceRegex = val(template.data.replaceRegex, new RegExp "#{template.trigger}[A-Za-z0-9-_]*$")

	template.up = =>
		current = template.find('.popup-item.selected')
		previous = current.previousElementSibling or template.find('.popup-item:last-child')
		if previous?
			current.className = current.className.replace /\sselected/, ''
			previous.className += ' selected'
			template.value.set previous.getAttribute('data-id')

	template.down = =>
		current = template.find('.popup-item.selected')
		next = current.nextElementSibling or template.find('.popup-item')
		if next?
			current.className = current.className.replace /\sselected/, ''
			next.className += ' selected'
			template.value.set next.getAttribute('data-id')

	template.verifySelection = =>
		current = template.find('.popup-item.selected')
		if not current?
			first = template.find('.popup-item')
			if first?
				first.className += ' selected'
				template.value.set first.getAttribute('data-id')

	template.onInputKeydown = (event) =>
		if template.open.curValue isnt true
			return

		if event.which is 13
			template.open.set false
			template.input.value = template.input.value.replace template.selectorRegex, template.prefix + template.value.curValue + template.suffix
			event.preventDefault()
			event.stopPropagation()

	template.onInputKeyup = (event) =>
		if template.open.curValue is true and event.which is 27
			template.open.set false
			event.preventDefault()
			event.stopPropagation()
			return

		if template.matchSelectorRegex.test template.input.value
			template.textFilter.set(template.input.value.match(template.selectorRegex)[1])
			template.open.set true
		else
			template.open.set false

		if template.open.curValue isnt true
			return

		if event.which is 38
			template.up()
		else if event.which is 40
			template.down()
		else
			Meteor.defer =>
				template.verifySelection()


Template.messagePopup.onRendered ->
	this.input = this.data.getInput?()
	$(this.input).on 'keyup', this.onInputKeyup.bind this
	$(this.input).on 'keydown', this.onInputKeydown.bind this


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
		result = template.data.getFilter template.data.collection, filter
		if (template.data.collection instanceof Meteor.Collection and result.count() is 0) or result?.length is 0
			template.open.set false

		return result
