/* globals Modernizr */
RocketChat.Login = (function() {
	function onClick(el) {
		const $el = $(el);
		if ($el.length) {
			$el.addClass('active');
			return $el.find('input').focus();
		}
	}
	function onBlur(input) {
		const $input = $(input);
		if ($input.length) {
			if (input.value === '') {
				return $input.parents('.input-text').removeClass('active');
			}
		}
	}
	function check(form) {
		const $form = $(form);
		if ($form.length) {
			const inputs = $form.find('input');
			return inputs.each(function() {
				if (this.value !== '') {
					console.log(this.value);
					return $(this).parents('.input-text').addClass('active');
				}
			});
		}
	}
	return { check, onClick, onBlur	};
}());

RocketChat.Button = (function() {
	let time = undefined;
	const loading = function(el) {
		const next = el.attr('data-loading-text');
		const html = el.find('span').html();
		el.addClass('-progress').attr('data-def-text', html).find('span').html(next);
		return time = setTimeout(() => el.addClass('going'), 1);
	};
	const done = function(el) {
		return el.addClass('done');
	};
	const reset = function(el) {
		if (time) { clearTimeout(time); }
		const $el = $(el);
		const html= $el.attr('data-def-text');
		if (html) { $el.find('span').html(html); }
		return $el.removeClass('-progress going done');
	};
	return { done, loading, reset };
}());

RocketChat.animationSupport = function() {
	const animeEnd = {
		WebkitAnimation: 'webkitAnimationEnd',
		OAnimation: 'oAnimationEnd',
		msAnimation: 'MSAnimationEnd',
		animation: 'animationend'
	};

	const transEndEventNames = {
		WebkitTransition: 'webkitTransitionEnd',
		MozTransition: 'transitionend',
		OTransition: 'oTransitionEnd otransitionend',
		msTransition: 'MSTransitionEnd',
		transition: 'transitionend'
	};
	const prefixB = transEndEventNames[Modernizr.prefixed('transition')];
	const prefixA = animeEnd[Modernizr.prefixed('animation')];
	const support = Modernizr.cssanimations;
	return {
		support,
		animation: prefixA,
		transition: prefixB
	};
};

RocketChat.animeBack = function(e, callback, type) {
	const el = $(e);
	if (!el.length > 0) {
		if (callback) { callback(el); }
		return;
	}
	const s = RocketChat.animationSupport();
	const p = ((type ? s.animation : s.transition));
	el.one(p, function(e) {

		//el.off(p);
		callback(e);
	});

};

RocketChat.preLoadImgs = function(urls, callback) {
	const preLoader = $('<div/>').attr({id: 'perverter-preloader'});
	let ended = undefined;
	const l_ = function(x) {
		if (x.width > 0) {
			$(x).addClass('loaded').removeClass('loading');
			const loaded = $('.loaded', preLoader);
			if ((loaded.length === urls.length) && !ended) {
				ended = 1;
				const imgs = preLoader.children();
				callback(imgs);
				preLoader.remove();
			}
		}
	};
	return urls.map(url => {
		const im = new Image();
		im.onload = function() {
			l_(this);
		};
		$(im).appendTo(preLoader).addClass('loading');
		im.src = url;
		if (im.width > 0) { l_(im); }
		return im;
	});

};
