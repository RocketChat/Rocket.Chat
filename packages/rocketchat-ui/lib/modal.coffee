@Modal = (->

	self = {}
	win = $(window)

	#mistérios da vida c.483: Pq a self.$window diz ter 100% da janela via css mas na verdade ocupa menos de 100% da tela?
	#isso impede que o retorno da janela ao normal quando não mais necessária a classe fluid. (comportamento dançante)

	focus = ->
		if self.$modal
			input = self.$modal.find "input[type='text']"
			input.get(0).focus() if input.length
	keydown = (e) ->
		k = e.which
		if k is 27
			e.preventDefault()
			e.stopImmediatePropagation()
			close()

	check = ->
		if self.$modal and self.$modal.length
			if win.height() < self.$window.outerHeight() + (win.height() * 0.10)
				unless self.$modal.hasClass("fluid")
					self.$modal.addClass("fluid")
			#else
				#if self.$modal.hasClass("fluid")
					#self.$modal.removeClass("fluid")

	open = (template, params) ->
		params = params or {}
		RocketChat.animeBack self.$modal, ->
			focus()
		self.opened = 1
		startListening() if params.listening
		setContent template, params.data if template?
		self.$modal.addClass "opened"
		self.$modal.removeClass "fluid"
		setTimeout ->
			focus()
		,200

	close = ->
		self.$modal.addClass "closed"
		win.unbind("keydown.modal")
		# acionar no on-complete da animação
		setTimeout ->
			self.opened = 0
			stopListening()
			self.$modal.removeClass "opened closed"
		, 300

	setContent = (template, data) ->
		self.$main.empty()
		if template
			if data
				Blaze.renderWithData template, data, self.$main.get(0)
			else
				Blaze.render template, self.$main.get(0)
			checkFooter()
			check()

	checkFooter = ->
		if self.$footer and self.$footer.length
			buttons = self.$footer.find "button"
			buttons.each ->
				btn = $(@)
				if btn.html().match /fechar/ig
					btn.click (e) ->
						e.preventDefault()
						close()

	startListening = ->
		stopListening()
		self.interval = setInterval ->
			check()
		, 100

	stopListening = ->
		clearInterval self.interval if self.interval

	init = ($modal, params) ->
		self.params = params or {}
		self.opened = 0
		self.initialized = 0
		self.$modal = if $modal.length then $modal else $(".rocket-modal")
		if self.$modal.length
			self.initialized = 0
			self.$window = self.$modal.find ".modal"
			self.$main = self.$modal.find "main"
			self.$close = self.$modal.find "header > .close"
			self.$footer = self.$modal.find "footer"
			self.$close.unbind("click").click close
			win.unbind("resize.modal").bind "resize.modal", check
			win.unbind("keydown.modal").bind "keydown.modal", (e) ->
				keydown(e)

	init: init
	open: open
	close: close
	focus: focus
	setContent: setContent
)()
