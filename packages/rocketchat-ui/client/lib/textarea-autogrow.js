(function($) {
	/**
	 * Auto-growing textareas; technique ripped from Facebook
	 *
	 *
	 * http://github.com/jaz303/jquery-grab-bag/tree/master/javascripts/jquery.autogrow-textarea.js
	 */
	$.fn.autogrow = function(options) {
		return this.filter('textarea').each(function() {
			var self = this;
			var $self = $(self);
			var minHeight = $self.height();
			var settings = $.extend({
				preGrowCallback: null,
				postGrowCallback: null
			}, options);

			const maxHeight = window.getComputedStyle(self)['max-height'].replace('px', '');

			var shadow = $("div.autogrow-shadow");
			if (!shadow.length) {
				shadow = $('<div></div>').addClass("autogrow-shadow").appendTo(document.body);
			}

			shadow.css({
				position: 'absolute',
				top: -10000,
				left: -10000,
				width: $self.width(),
				fontSize: $self.css('fontSize'),
				fontFamily: $self.css('fontFamily'),
				fontWeight: $self.css('fontWeight'),
				lineHeight: $self.css('lineHeight'),
				resize: 'none',
				wordWrap: 'break-word'
			});

			var update = function(event) {
				var times = function(string, number) {
					for (var i = 0, r = ''; i < number; i++) r += string;
					return r;
				};

				var val = self.value.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/&/g, '&amp;')
					.replace(/\n$/, '<br/>&nbsp;')
					.replace(/\n/g, '<br/>')
					.replace(/ {2,}/g, function(space) {
						return times('&nbsp;', space.length - 1) + ' ';
					});

				// Did enter get pressed?  Resize in this keydown event so that the flicker doesn't occur.
				if (event && event.data && event.data.event === 'keydown' && event.keyCode === 13 && (event.shiftKey || event.ctrlKey || event.altKey)) {
					val += '<br />';
				}

				shadow.css('width', $self.width());
				shadow.html(val);

				var newHeight = Math.max(shadow.height() + 1, minHeight) + 1;
				if (settings.preGrowCallback !== null) {
					newHeight = settings.preGrowCallback($self, shadow, newHeight, minHeight);
				}

				if(newHeight === $self[0].offsetHeight){
					return true;
				}

				var overflow = 'hidden';
				if(maxHeight <= newHeight){
					newHeight = maxHeight;
					overflow = ''
				} else {
					overflow = 'hidden'
				}

				$self.stop().animate( { height: newHeight }, { duration: 100, complete: ()=> {
					$self.trigger('autogrow', []);
				}}).css('overflow', overflow);

				$self.trigger('autogrow', []);

				if (settings.postGrowCallback !== null) {
					settings.postGrowCallback($self);
				}
			};

			$self.on('focus change input', update);
			$(window).resize(update);

			update();
			self.updateAutogrow = update;
		});
	};
})(jQuery);
