this.Modal = (function() {

	const self = {};
	const win = $(window);

	//mistérios da vida c.483: Pq a self.$window diz ter 100% da janela via css mas na verdade ocupa menos de 100% da tela?
	//isso impede que o retorno da janela ao normal quando não mais necessária a classe fluid. (comportamento dançante)

	function focus() {
		if (self.$modal) {
			const input = self.$modal.find('input[type=\'text\']');
			if (input.length) { return input.get(0).focus(); }
		}
	}
	function check() {
		if (self.$modal && self.$modal.length) {
			if (win.height() < (self.$window.outerHeight() + (win.height() * 0.10))) {
				if (!self.$modal.hasClass('fluid')) {
					return self.$modal.addClass('fluid');
				}
			}
		}
	}
	function stopListening() {
		if (self.interval) { return clearInterval(self.interval); }
	}
	function startListening() {
		stopListening();
		return self.interval = setInterval(() => check(), 100);
	}


	function close() {
		self.$modal.addClass('closed');
		win.unbind('keydown.modal');
		// acionar no on-complete da animação
		return setTimeout(function() {
			self.opened = 0;
			stopListening();
			return self.$modal.removeClass('opened closed');
		}, 300);
	}
	function keydown(e) {
		const k = e.which;
		if (k === 27) {
			e.preventDefault();
			e.stopImmediatePropagation();
			return close();
		}
	}
	function checkFooter() {
		if (self.$footer && self.$footer.length) {
			const buttons = self.$footer.find('button');
			return buttons.each(function() {
				const btn = $(this);
				if (btn.html().match(/fechar/ig)) {
					return btn.click(function(e) {
						e.preventDefault();
						return close();
					});
				}
			});
		}
	}

	function setContent(template, data) {
		self.$main.empty();
		if (template) {
			if (data) {
				Blaze.renderWithData(template, data, self.$main.get(0));
			} else {
				Blaze.render(template, self.$main.get(0));
			}
			checkFooter();
			return check();
		}
	}

	function open(template, params) {
		params = params || {};
		RocketChat.animeBack(self.$modal, () => focus());
		self.opened = 1;
		if (params.listening) { startListening(); }
		if (template != null) { setContent(template, params.data); }
		self.$modal.addClass('opened');
		self.$modal.removeClass('fluid');
		return setTimeout(() => focus(), 200);
	}

	function init($modal, params) {
		self.params = params || {};
		self.opened = 0;
		self.initialized = 0;
		self.$modal = $modal.length ? $modal : $('.rocket-modal');
		if (self.$modal.length) {
			self.initialized = 0;
			self.$window = self.$modal.find('.modal');
			self.$main = self.$modal.find('main');
			self.$close = self.$modal.find('header > .close');
			self.$footer = self.$modal.find('footer');
			self.$close.unbind('click').click(close);
			win.unbind('resize.modal').bind('resize.modal', check);
			return win.unbind('keydown.modal').bind('keydown.modal', e => keydown(e));
		}
	}

	return { init, open, close, focus, setContent };
}());
