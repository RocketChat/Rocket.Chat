@FlexTab = new class
	flexTab = {}
	animating = false
	open = false

	template = new ReactiveVar ''
	data = new ReactiveVar {}

	init = ->
		flexTab = $('.flex-tab-bar')
		show()

	check = ->
		$flex = $("section.flex-tab")
		if $flex.length
			$search = $flex.find ".search-form"
			if $search.length
				$siblings = $search.siblings("a")
				if $siblings.length
					width = ($siblings.outerWidth() + $siblings.css("marginLeft").replace("px","") * 2) * $siblings.length + 1
					$search.css
						width: "calc(100% - #{width}px)"

	focusInput = ->
		setTimeout ->
			flexTab.find("input[type='text']:first")?.focus()
		, 200
		return

	setFlex = (t, d = {}) ->
		template.set t
		data.set d

	getFlex = ->
		return {
			template: template.get()
			data: data.get()
		}

	openFlex = () ->
		return if animating == true
		toggleFlex 1
		focusInput()

	closeFlex = () ->
		return if animating == true
		toggleFlex -1

	toggleFlex = (status = null, callback = null) ->
		return if animating == true
		animating = true
		if status is -1 or (status isnt 1 and open)
			open = false
			Session.set 'flexOpened'
		else
			open = true

			# added a delay to make sure the template is already rendered before animating it
			setTimeout ->
				Session.set 'flexOpened', true
			, 50
		setTimeout ->
			animating = false
			callback?()
		, 500

	show = ->
		flexTab.show() if flexTab
	
	hide = ->
		flexTab.hide() if flexTab

	isOpen = ->
		return open

	getFlexTab = ->
		return flexTab

	init: init
	check: check
	setFlex: setFlex
	getFlex: getFlex
	openFlex: openFlex
	closeFlex: closeFlex
	show: show
	hide: hide
	isOpen: isOpen
	getFlexTab: getFlexTab