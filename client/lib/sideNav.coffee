@SideNav = (->

	sideNav = {}
	flexNav = {}
	arrow = {}
	animating = false

	toggleArrow = (status) ->
		if arrow.hasClass "left" or status? is -1
			arrow.removeClass "left"
			return
		if not arrow.hasClass "left" or status? is 1
			arrow.addClass "left"

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

	toggleFlex = (status) ->
		return if animating == true
		animating = true
		if flexNav.opened or status? is -1
			flexNav.opened = false
			flexNav.addClass "hidden"
			setTimeout ->
				animating = false
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
			, 500


	openFlex = ->
		return if animating == true
		toggleArrow 1
		toggleFlex 1
		focusInput()

	closeFlex = ->
		return if animating == true
		toggleArrow -1
		toggleFlex -1

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
