RocketChat.Login = (->
		onClick = (el) ->
			$el = $(el)
			if $el.length
				$el.addClass "active"
				$el.find("input").focus()
		onBlur = (input) ->
			$input = $(input)
			if $input.length
				if input.value == ""
					$input.parents(".input-text").removeClass "active"
		check = (form) ->
			$form = $(form)
			if $form.length
				inputs = $form.find("input")
				inputs.each ->
					if @.value != ""
						console.log @.value
						$(@).parents(".input-text").addClass "active"
		check: check
		onClick: onClick
		onBlur: onBlur
	)()

RocketChat.Button = (->
		time = undefined
		loading = (el) ->
			$el = $(el)
			next = el.attr("data-loading-text")
			html = el.find("span").html()
			el.addClass("-progress").attr("data-def-text",html).find("span").html(next)
			time = setTimeout ->
				el.addClass("going")
			, 1
		done = (el) ->
			$el = $(el)
			el.addClass("done")
		reset = (el) ->
			clearTimeout(time) if time
			$el = $(el)
			html= $el.attr("data-def-text")
			$el.find("span").html(html) if html
			$el.removeClass("-progress going done")
		done: done
		loading: loading
		reset: reset
	)()

RocketChat.animationSupport = ->
		animeEnd =
			WebkitAnimation: "webkitAnimationEnd"
			OAnimation: "oAnimationEnd"
			msAnimation: "MSAnimationEnd"
			animation: "animationend"

		transEndEventNames =
			WebkitTransition: "webkitTransitionEnd"
			MozTransition: "transitionend"
			OTransition: "oTransitionEnd otransitionend"
			msTransition: "MSTransitionEnd"
			transition: "transitionend"
		prefixB = transEndEventNames[Modernizr.prefixed("transition")]
		prefixA = animeEnd[Modernizr.prefixed("animation")]
		support = Modernizr.cssanimations
		support: support
		animation: prefixA
		transition: prefixB

RocketChat.animeBack = (el, callback, type) ->
		el = $(el)
		if not el.length > 0
			callback el    if callback
			return
		s = animationSupport()
		p = ((if type then s.animation else s.transition))
		el.one p, (e) ->

			#el.off(p);
			callback e
			return

		return

RocketChat.preLoadImgs = (urls, callback) ->
		L_ = (x) ->
			if x.width > 0
				$(x).addClass("loaded").removeClass "loading"
				loaded = $(".loaded", preLoader)
				if loaded.length is urls.length and not ended
					ended = 1
					imgs = preLoader.children()
					callback imgs
					preLoader.remove()
			return
		im = new Array()
		preLoader = $("<div/>").attr(id: "perverter-preloader")
		loaded = undefined
		ended = undefined
		i = 0

		while i < urls.length
			im[i] = new Image()
			im[i].onload = ->
				L_ this
				return

			$(im[i]).appendTo(preLoader).addClass "loading"
			im[i].src = urls[i]
			L_ im[i]    if im[i].width > 0
			i++

		return
