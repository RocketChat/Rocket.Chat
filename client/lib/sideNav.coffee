@SideNav = (->

	sideNav = {}
	flexNav = {}

	toggleFlex = (status) ->
		if flexNav.opened or status? is -1
			flexNav.opened = false
			flexNav.addClass "hidden"
			return
		if not flexNav.opened or status? is 1
			flexNav.opened = true
			flexNav.removeClass "hidden"

	openFlex = ->
		AccountBox.toggleArrow 1
		toggleFlex 1

	closeFlex = ->
		AccountBox.toggleArrow -1
		toggleFlex -1

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
		setFlex ""

	init: init
	setFlex: setFlex
	getFlex: getFlex
	openFlex: openFlex
	closeFlex: closeFlex

)()