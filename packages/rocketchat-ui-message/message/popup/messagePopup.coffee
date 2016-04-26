# This is not supposed to be a complete list
# it is just to improve readability in this file
keys = {
	TAB: 9
	ENTER: 13
	ESC: 27
	ARROW_LEFT: 37
	ARROW_UP: 38
	ARROW_RIGHT: 39
	ARROW_DOWN: 40
}

getCursorPosition = (input) ->
	if not input? then return
	if input.selectionStart?
		return input.selectionStart
	else if document.selection?
		input.focus()
		sel = document.selection.createRange()
		selLen = document.selection.createRange().text.length
		sel.moveStart('character', - input.value.length)
		return sel.text.length - selLen

setCursorPosition = (input, caretPos) ->
	if not input? then return
	if input.selectionStart?
		input.focus()
		return input.setSelectionRange(caretPos, caretPos)
	else if document.selection?
		range = input.createTextRange()
		range.move('character', caretPos)
		range.select()

val = (v, d) ->
	return if v? then v else d

Template.messagePopup.onCreated ->
	template = this

	template.textFilter = new ReactiveVar ''

	template.textFilterDelay = val(template.data.textFilterDelay, 0)

	template.open = new ReactiveVar false

	template.hasData = new ReactiveVar false

	template.value = new ReactiveVar

	template.trigger = val(template.data.trigger, '@')

	template.triggerAnywhere = val(template.data.triggerAnywhere, true)

	template.prefix = val(template.data.prefix, template.trigger)

	template.suffix = val(template.data.suffix, ' ')

	if template.triggerAnywhere is true
		template.matchSelectorRegex = val(template.data.matchSelectorRegex, new RegExp "(?:^| )#{template.trigger}[^\\s]*$")
	else
		template.matchSelectorRegex = val(template.data.matchSelectorRegex, new RegExp "(?:^)#{template.trigger}[^\\s]*$")

	template.selectorRegex = val(template.data.selectorRegex, new RegExp "#{template.trigger}([^\\s]*)$")

	template.replaceRegex = val(template.data.replaceRegex, new RegExp "#{template.trigger}[^\\s]*$")

	template.getValue = val template.data.getValue, (_id) -> return _id

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
			else
				template.value.set undefined

	template.onInputKeydown = (event) =>
		if template.open.curValue isnt true or template.hasData.curValue isnt true
			return

		if event.which in [keys.ARROW_UP, keys.ARROW_DOWN]
			event.preventDefault()
			event.stopPropagation()

		if event.which in [keys.ENTER, keys.TAB]
			template.open.set false

			template.enterValue()

			event.preventDefault()
			event.stopPropagation()

		if event.which is keys.ARROW_UP
			template.up()
		else if event.which is keys.ARROW_DOWN
			template.down()

	template.setTextFilter = _.debounce (value) ->
		template.textFilter.set(value)
	, template.textFilterDelay

	template.onInputKeyup = (event) =>
		if template.open.curValue is true and event.which is keys.ESC
			template.open.set false
			event.preventDefault()
			event.stopPropagation()
			return

		value = template.input.value
		value = value.substr 0, getCursorPosition(template.input)

		if template.matchSelectorRegex.test value
			template.setTextFilter value.match(template.selectorRegex)[1]
			template.open.set true
		else
			template.open.set false

		if template.open.curValue isnt true
			return

		if event.which not in [keys.ARROW_UP, keys.ARROW_DOWN]
			Meteor.defer =>
				template.verifySelection()

	template.enterValue = ->
		if not template.value.curValue? then return

		value = template.input.value
		caret = getCursorPosition(template.input)
		firstPartValue = value.substr 0, caret
		lastPartValue = value.substr caret

		firstPartValue = firstPartValue.replace(template.selectorRegex, template.prefix + this.getValue(template.value.curValue, template.data.collection, firstPartValue) + template.suffix)

		template.input.value = firstPartValue + lastPartValue

		setCursorPosition template.input, firstPartValue.length

	template.records = new ReactiveVar []
	Tracker.autorun ->
		if template.data.collection.find?
			template.data.collection.find().count()

		filter = template.textFilter.get()
		if filter?
			result = template.data.getFilter template.data.collection, filter
			if (template.data.collection instanceof Meteor.Collection and result.count? and result.count() is 0) or result?.length is 0
				template.hasData.set false
			else
				template.hasData.set true

			template.records.set result

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

		template.enterValue()

		template.open.set false


Template.messagePopup.helpers
	isOpen: ->
		Template.instance().open.get() and (Template.instance().hasData.get() or not Template.instance().parentTemplate(1).subscriptionsReady())

	data: ->
		template = Template.instance()

		return template.records.get()
