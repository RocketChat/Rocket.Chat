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

	template.open = val(template.data.open, new ReactiveVar(false))

	template.hasData = new ReactiveVar false

	template.value = new ReactiveVar

	template.trigger = val(template.data.trigger, '')

	template.triggerAnywhere = val(template.data.triggerAnywhere, true)

	template.closeOnEsc = val(template.data.closeOnEsc, true)

	template.blurOnSelectItem = val(template.data.blurOnSelectItem, false)

	template.prefix = val(template.data.prefix, template.trigger)

	template.suffix = val(template.data.suffix, '')

	if template.triggerAnywhere is true
		template.matchSelectorRegex = val(template.data.matchSelectorRegex, new RegExp "(?:^| )#{template.trigger}[^\\s]*$")
	else
		template.matchSelectorRegex = val(template.data.matchSelectorRegex, new RegExp "(?:^)#{template.trigger}[^\\s]*$")

	template.selectorRegex = val(template.data.selectorRegex, new RegExp "#{template.trigger}([^\\s]*)$")

	template.replaceRegex = val(template.data.replaceRegex, new RegExp "#{template.trigger}[^\\s]*$")

	template.getValue = val template.data.getValue, (_id) -> return _id

	template.up = =>
		current = template.find('.popup-item.selected')
		previous = $(current).prev('.popup-item')[0] or template.find('.popup-item:last-child')
		if previous?
			current.className = current.className.replace /\sselected/, ''
			previous.className += ' selected'
			template.value.set previous.getAttribute('data-id')

	template.down = =>
		current = template.find('.popup-item.selected')
		next = $(current).next('.popup-item')[0] or template.find('.popup-item')
		if next?.classList.contains('popup-item')
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

		if event.which in [keys.ENTER, keys.TAB]
			if template.blurOnSelectItem is true
				template.input.blur()
			else
				template.open.set false

			template.enterValue()

			if template.data.cleanOnEnter
				template.input.value = ''

			event.preventDefault()
			event.stopPropagation()
			return

		if event.which is keys.ARROW_UP
			template.up()

			event.preventDefault()
			event.stopPropagation()
			return

		if event.which is keys.ARROW_DOWN
			template.down()

			event.preventDefault()
			event.stopPropagation()
			return

	template.setTextFilter = _.debounce (value) ->
		template.textFilter.set(value)
	, template.textFilterDelay

	template.onInputKeyup = (event) =>
		if template.closeOnEsc is true and template.open.curValue is true and event.which is keys.ESC
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

	template.onFocus = (event) =>
		template.clickingItem = false;

		if template.open.curValue is true
			return

		value = template.input.value
		value = value.substr 0, getCursorPosition(template.input)

		if template.matchSelectorRegex.test value
			template.setTextFilter value.match(template.selectorRegex)[1]
			template.open.set true
			Meteor.defer =>
				template.verifySelection()
		else
			template.open.set false

	template.onBlur = (event) =>
		if template.open.curValue is false
			return

		if template.clickingItem is true
			return

		template.open.set false

	template.enterValue = ->
		if not template.value.curValue? then return

		value = template.input.value
		caret = getCursorPosition(template.input)
		firstPartValue = value.substr 0, caret
		lastPartValue = value.substr caret
		getValue = this.getValue(template.value.curValue, template.data.collection, template.records.get(), firstPartValue)

		if not getValue
			return

		firstPartValue = firstPartValue.replace(template.selectorRegex, template.prefix + getValue + template.suffix)

		template.input.value = firstPartValue + lastPartValue

		setCursorPosition template.input, firstPartValue.length

	template.records = new ReactiveVar []
	Tracker.autorun ->
		if template.data.collection.findOne?
			template.data.collection.find().count()

		filter = template.textFilter.get()
		if filter?
			filterCallback = (result) =>
				template.hasData.set result?.length > 0
				template.records.set result

				Meteor.defer =>
					template.verifySelection()

			result = template.data.getFilter(template.data.collection, filter, filterCallback)
			if result?
				filterCallback result


Template.messagePopup.onRendered ->
	if this.data.getInput?
		this.input = this.data.getInput?()
	else if this.data.input
		this.input = this.parentTemplate().find(this.data.input)

	if not this.input?
		console.error 'Input not found for popup'

	$(this.input).on 'keyup', this.onInputKeyup.bind this
	$(this.input).on 'keydown', this.onInputKeydown.bind this
	$(this.input).on 'focus', this.onFocus.bind this
	$(this.input).on 'blur', this.onBlur.bind this


Template.messagePopup.onDestroyed ->
	$(this.input).off 'keyup', this.onInputKeyup
	$(this.input).off 'keydown', this.onInputKeydown
	$(this.input).off 'focus', this.onFocus
	$(this.input).off 'blur', this.onBlur


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

	'mousedown .popup-item, touchstart .popup-item': (e) ->
		template = Template.instance()
		template.clickingItem = true;

	'mouseup .popup-item, touchend .popup-item': (e) ->
		template = Template.instance()

		template.clickingItem = false;

		template.value.set this._id

		template.enterValue()

		template.open.set false


Template.messagePopup.helpers
	isOpen: ->
		Template.instance().open.get() and ((Template.instance().hasData.get() or Template.instance().data.emptyTemplate?) or not Template.instance().parentTemplate(1).subscriptionsReady())

	data: ->
		template = Template.instance()

		return template.records.get()
