/* globals Blaze, Template */
import _ from 'underscore';

RocketChat.EmojiPicker = {
	width: 390,
	height: 238,
	initiated: false,
	input: null,
	source: null,
	recent: [],
	tone: null,
	opened: false,
	pickCallback: null,
	init() {
		if (this.initiated) {
			return;
		}
		this.initiated = true;

		this.recent = window.localStorage.getItem('emoji.recent') ? window.localStorage.getItem('emoji.recent').split(',') : [];
		this.tone = window.localStorage.getItem('emoji.tone') || 0;

		Blaze.render(Template.emojiPicker, document.body);

		$(document).click((event) => {
			if (!this.opened) {
				return;
			}
			if (!$(event.target).closest('.emoji-picker').length && !$(event.target).is('.emoji-picker')) {
				if (this.opened) {
					this.close();
				}
			}
		});

		$(window).resize(_.debounce(() => {
			if (!this.opened) {
				return;
			}
			this.setPosition();
		}, 300));
	},
	isOpened() {
		return this.opened;
	},
	setTone(tone) {
		this.tone = tone;
		window.localStorage.setItem('emoji.tone', tone);
	},
	getTone() {
		return this.tone;
	},
	getRecent() {
		return this.recent;
	},
	setPosition() {
		const sourcePos = $(this.source).offset();
		const left = sourcePos.left;
		const top = (sourcePos.top - this.height - 5);
		const cssProperties = {
			top,
			left
		};

		if (top < 0) {
			cssProperties.top = 10;
		}

		if (left < 35) {
			cssProperties.left = 0;
		} else {
			const windowSize = $(window).width();
			const pickerWidth = $('.emoji-picker').width();

			if (left + pickerWidth > windowSize) {
				cssProperties.left = left - pickerWidth;
			}
		}

		return $('.emoji-picker').css(cssProperties);
	},
	open(source, callback) {
		if (!this.initiated) {
			this.init();
		}
		this.pickCallback = callback;
		this.source = source;

		const containerEl = this.setPosition();
		containerEl.addClass('show');

		const emojiInput = containerEl.find('.emoji-filter input.search');
		if (emojiInput) {
			emojiInput.focus();
		}
		this.opened = true;
	},
	close() {
		$('.emoji-picker').removeClass('show');
		this.opened = false;
	},
	pickEmoji(emoji) {
		this.pickCallback(emoji);

		this.close();
		this.addRecent(emoji);
	},
	addRecent(emoji) {
		const pos = this.recent.indexOf(emoji);

		if (pos !== -1) {
			this.recent.splice(pos, 1);
		}

		this.recent.unshift(emoji);

		window.localStorage.setItem('emoji.recent', this.recent);
		RocketChat.emoji.packages.base.emojisByCategory.recent = this.recent;
		this.updateRecent();
	},
	updateRecent() {
		const instance = Template.instance();
		if (instance) {
			instance.recentNeedsUpdate.set(true);
		} else {
			this.refreshDynamicEmojiLists();
		}
	},
	refreshDynamicEmojiLists() {
		const dynamicEmojiLists = [
			RocketChat.emoji.packages.base.emojisByCategory.recent,
			RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket
		];

		dynamicEmojiLists.forEach((category) => {
			if (category) {
				for (let i = 0; i < category.length; i++) {
					const emoji = category[i];
					if (!RocketChat.emoji.list[`:${ emoji }:`]) {
						category = _.without(category, emoji);
					}
				}
			}
		});
	}
};
