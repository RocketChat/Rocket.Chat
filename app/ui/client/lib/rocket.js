export const Login = (function () {
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
			return inputs.each(function () {
				if (this.value !== '') {
					console.log(this.value);
					return $(this).parents('.input-text').addClass('active');
				}
			});
		}
	}
	return { check, onClick, onBlur };
})();

export const Button = (function () {
	let time = undefined;
	const loading = function (el) {
		const next = el.attr('data-loading-text');
		const html = el.find('span').html();
		el.addClass('-progress').attr('data-def-text', html).find('span').html(next);
		time = setTimeout(() => el.addClass('going'), 1);
		return time;
	};
	const done = function (el) {
		return el.addClass('done');
	};
	const reset = function (el) {
		if (time) {
			clearTimeout(time);
		}
		const $el = $(el);
		const html = $el.attr('data-def-text');
		if (html) {
			$el.find('span').html(html);
		}
		return $el.removeClass('-progress going done');
	};
	return { done, loading, reset };
})();
