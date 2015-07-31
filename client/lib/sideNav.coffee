@SideNav = (->

	sideNav = {}
	flexNav = {}
	arrow = {}
	animating = false

	toggleArrow = (status) ->
		if arrow.hasClass "top" or status? is -1
			arrow.removeClass "top"
			arrow.addClass "bottom"
			return
		if not arrow.hasClass "top" or status? is 1
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

	toggleFlex = (status, callback = null) ->
		return if animating == true
		animating = true
		if flexNav.opened or status? is -1
			flexNav.opened = false
			flexNav.addClass "hidden"
			setTimeout ->
				animating = false
				callback?()
			, 350
			return
		if not flexNav.opened or status? is 1
			flexNav.opened = true
			# added a delay to make sure the template is already rendered before animating it
			setTimeout ->
				flexNav.removeClass "hidden"
			, 50
			setTimeout ->
				animating = false
				callback?()
			, 500

	openFlex = (callback = null) ->
		return if animating == true
		toggleArrow 1
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
)()
