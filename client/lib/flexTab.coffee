@FlexTab = new class
	animating = false
	open = false

	template = new ReactiveVar ''
	data = new ReactiveVar {}

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
			$('.flex-tab')?.find("input[type='text']:first")?.focus()
		, 200
		return

	setFlex = (t, d = {}, callback) ->
		return if animating is true
		template.set t
		data.set d
		openFlex(callback)

	getFlex = ->
		return {
			template: template.get()
			data: data.get()
		}

	openFlex = (callback) ->
		return if animating is true
		toggleFlex 1, callback
		# focusInput()

	closeFlex = (callback) ->
		return if animating is true
		toggleFlex -1, callback

	toggleFlex = (status, callback) ->
		return if animating is true
		animating = true
		$('.tab-button').removeClass 'active'

		if status is -1 or (status isnt 1 and open)
			open = false
			Session.set 'flexOpened'
		else
			open = true
			$(".tab-button[data-target='#{template.get()}']").addClass 'active'

			# added a delay to make sure the template is already rendered before animating it
			setTimeout ->
				Session.set 'flexOpened', true
			, 50
		setTimeout ->
			animating = false
			callback?()
		, 500

	show = ->
		$('.flex-tab-bar').show()
	
	hide = ->
		closeFlex()
		$('.flex-tab-bar').hide()

	isOpen = ->
		return open

	check: check
	setFlex: setFlex
	getFlex: getFlex
	openFlex: openFlex
	closeFlex: closeFlex
	show: show
	hide: hide
	isOpen: isOpen
