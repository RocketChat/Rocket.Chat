RocketChat.TabBar = new class
	$tabBar = {}
	$tabButtons = {}

	buttons = new ReactiveVar {}

	extraGroups = {}

	open = new ReactiveVar false
	template = new ReactiveVar ''
	data = new ReactiveVar {}

	visibleGroup = new ReactiveVar ''

	setTemplate = (t, callback) ->
		template.set t
		openFlex(callback)

	getTemplate = ->
		return template.get()

	setData = (d) ->
		data.set d

	getData = ->
		return data.get()

	openFlex = (callback) ->
		toggleFlex 1, callback

	closeFlex = (callback) ->
		toggleFlex -1, callback

	toggleFlex = (status, callback) ->
		if status is -1 or (status isnt 1 and open.get())
			open.set false
		else
			$('.flex-tab .content').scrollTop(0)
			# added a delay to make sure the template is already rendered before animating it
			setTimeout ->
				open.set true
			, 50
		setTimeout ->
			callback?()
		, if open.get() then 0 else 500

	show = ->
		$('.flex-tab-bar').show()

	hide = ->
		closeFlex()
		$('.flex-tab-bar').hide()

	isFlexOpen = ->
		return open.get()

	addButton = (config) ->
		unless config?.id
			return false

		Tracker.nonreactive ->
			btns = buttons.get()
			btns[config.id] = config

			if extraGroups[config.id]?
				btns[config.id].groups ?= []
				btns[config.id].groups = _.union btns[config.id].groups, extraGroups[config.id]
				delete extraGroups[config.id]

			buttons.set btns

	removeButton = (id) ->
		Tracker.nonreactive ->
			btns = buttons.get()
			delete btns[id]
			buttons.set btns

	updateButton = (id, config) ->
		Tracker.nonreactive ->
			btns = buttons.get()
			if btns[id]
				btns[id] = _.extend btns[id], config
				buttons.set btns

	getButtons = ->
		return _.sortBy (_.toArray buttons.get()), 'order'

	reset = ->
		resetButtons()
		closeFlex()
		template.set ''
		data.set {}

	resetButtons = ->
		buttons.set {}

	showGroup = (group) ->
		visibleGroup.set group

	getVisibleGroup = ->
		visibleGroup.get()

	addGroup = (id, groups) ->
		Tracker.nonreactive ->
			btns = buttons.get()
			if btns[id]
				btns[id].groups ?= []
				btns[id].groups = _.union btns[id].groups, groups
				buttons.set btns
			else
				extraGroups[id] ?= []
				extraGroups[id] = _.union extraGroups[id], groups

	setTemplate: setTemplate
	setData: setData
	getTemplate: getTemplate
	getData: getData
	openFlex: openFlex
	closeFlex: closeFlex
	isFlexOpen: isFlexOpen
	show: show
	hide: hide
	addButton: addButton
	updateButton: updateButton
	removeButton: removeButton
	getButtons: getButtons
	reset: reset
	resetButtons: resetButtons

	showGroup: showGroup
	getVisibleGroup: getVisibleGroup
	addGroup: addGroup
