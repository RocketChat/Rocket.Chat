@SideNav = (->
	initiated = false
	sideNav = {}
	flexNav = {}
	arrow = {}
	animating = false
	openQueue = []

	toggleArrow = (status = null) ->
		if status is 0
			arrow.addClass "close"
			arrow.removeClass "top"
			arrow.removeClass "bottom"
		else if status is -1 or (status isnt 1 and arrow.hasClass "top")
			arrow.removeClass "close"
			arrow.removeClass "top"
			arrow.addClass "bottom"
		else
			arrow.removeClass "close"
			arrow.addClass "top"
			arrow.removeClass "bottom"

	toggleCurrent = ->
		if flexNav.opened then closeFlex() else AccountBox.toggle()

	overArrow = ->
		arrow.addClass "hover"

	leaveArrow = ->
		arrow.removeClass "hover"

	arrowBindHover = ->
		arrow.on "mouseenter", ->
			sideNav.find("header").addClass "hover"
		arrow.on "mouseout", ->
			sideNav.find("header").removeClass "hover"

	focusInput = ->
		setTimeout ->
			sideNav.find("input[type='text']:first")?.focus()
		, 200
		return

	validate = ->
		invalid = []
		sideNav.find("input.required").each ->
			if not this.value.length
				invalid.push $(this).prev("label").html()
		if invalid.length
			return invalid
		return false;

	toggleFlex = (status = null, callback = null) ->
		return if animating == true
		animating = true
		if status is -1 or (status isnt 1 and flexNav.opened)
			flexNav.opened = false
			flexNav.addClass "animated-hidden"
		else
			flexNav.opened = true
			# added a delay to make sure the template is already rendered before animating it
			setTimeout ->
				flexNav.removeClass "animated-hidden"
			, 50
		setTimeout ->
			animating = false
			callback?()
		, 500

	openFlex = (callback = null) ->
		if not initiated
			return openQueue.push { config: getFlex(), callback: callback }

		return if animating == true
		AccountBox.close()
		toggleArrow 0
		toggleFlex 1, callback
		focusInput()

	closeFlex = (callback = null) ->
		return if animating == true
		toggleArrow -1
		toggleFlex -1, callback

	flexStatus = ->
		return flexNav.opened

	setFlex = (template, data={}) ->
		Session.set "flex-nav-template", template
		Session.set "flex-nav-data", data

	getFlex = ->
		return {
			template: Session.get "flex-nav-template"
			data: Session.get "flex-nav-data"
		}

	init = ->
		sideNav = $(".side-nav")
		flexNav = sideNav.find ".flex-nav"
		arrow = sideNav.children ".arrow"
		setFlex ""
		arrowBindHover()
		initiated = true

		if openQueue.length > 0
			openQueue.forEach (item) ->
				setFlex item.config.template, item.config.data
				openFlex item.callback

			openQueue = []

	getSideNav = ->
		return sideNav

	init: init
	setFlex: setFlex
	getFlex: getFlex
	openFlex: openFlex
	closeFlex: closeFlex
	validate: validate
	flexStatus: flexStatus
	toggleArrow: toggleArrow
	toggleCurrent: toggleCurrent
	overArrow: overArrow
	leaveArrow: leaveArrow
	getSideNav: getSideNav
)()
