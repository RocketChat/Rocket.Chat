@ScrollListener = (->

	container = {}
	rooms = {}
	timers = {}
	stopIt = false
	listening = false
	loader = false
	last = {}

	getRoom = ->
		return window.location.href.replace(/(.*)(\/room\/)(.*)/,"$3")

	getStatus = ->
		room = getRoom()
		if room? and rooms[room] is true
			return true
		return false

	setStatus = (status) ->
		rooms[getRoom()] = status

	startListening = ->
		return if listening
		listening = true
		listen = ->
			if container.box
				setTimeout ->
					window.requestAnimationFrame ->
						if getStatus()
							toBottom()
							listen()
							return
						listening = false
				, 100
		listen()

	onMouseWheel = (e) ->
		checkListener()

	onScroll = (e) ->
		if stopIt is false
			checkListener(10)

	checkListener = (dif = 0) ->
		maxScroll = container.wrapper.scrollHeight - container.wrapper.clientHeight
		if getStatus() is false and (container.wrapper.scrollTop + dif) >= maxScroll
			setStatus true
			startListening()
			return
		if (container.wrapper.scrollTop + dif) < maxScroll and getStatus() == true
			setStatus false

	setLoader = (status) ->
		if status
			last = container.box.querySelector(".message")
		else
			last = null
		loader = status

	clearShoot = ->
		stopIt = true
		setTimeout ->
			stopIt = false
		, 1

	toggleNewWarning = (status) ->
		if status
			if container.wrapper and (container.wrapper.scrollHeight - container.wrapper.clientHeight - container.wrapper.scrollTop > 25)
				container.warning.className = "new-message"
		else
			container.warning.className = "new-message not"

	toBottom = (force) ->
		if container.wrapper and (getStatus() is true or force is true)
			if loader and last
				if timers.reload
					clearTimeout timers.reload
				timers.reload = setTimeout ->
					clearShoot()
					top = $(last).position().top
					container.wrapper.scrollTop = $(last).position().top - ($(window).height()/2 - 100)
					setLoader false
				, 350
			else
				toggleNewWarning(false)

				if container.wrapper.scrollTop != (container.wrapper.scrollHeight - container.wrapper.clientHeight)
					clearShoot()
					container.wrapper.scrollTop = container.wrapper.scrollHeight - container.wrapper.clientHeight
		else
			if getStatus() is false
				toggleNewWarning(true)


	init = ->
		container.box = document.querySelector(".messages-box")
		if container.box
			container.warning = document.querySelector(".new-message")
			container.wrapper = container.box.querySelector(".wrapper")
			container.wrapper.addEventListener "scroll", onScroll
			container.wrapper.addEventListener "mousewheel", onMouseWheel
			setStatus true
			startListening()

	init: init
	toBottom: toBottom
	setLoader: setLoader

)()