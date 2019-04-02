import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { emoji } from '../../lib/rocketchat';
import _ from 'underscore';

export const EmojiPicker = {
	width: 365,
	height: 290,
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
		const windowHeight = window.innerHeight;
		const windowWidth = window.innerWidth;
		const windowBorder = 10;
		const sourcePos = $(this.source).offset();
		const { left, top } = sourcePos;
		const cssProperties = { top, left };
		const isLargerThanWindow = this.width + windowBorder > windowWidth;

		if (top + this.height >= windowHeight) {
			cssProperties.top = windowHeight - this.height - windowBorder;
		}

		if (left < windowBorder) {
			cssProperties.left = isLargerThanWindow ? 0 : windowBorder;
		}

		if (left + this.width >= windowWidth) {
			cssProperties.left = isLargerThanWindow ? 0 : windowWidth - this.width - windowBorder;
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

		const emojiInput = containerEl.find('input.js-emojipicker-search');
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
	addRecent(_emoji) {
		const pos = this.recent.indexOf(_emoji);

		if (pos !== -1) {
			this.recent.splice(pos, 1);
		}

		this.recent.unshift(_emoji);

		window.localStorage.setItem('emoji.recent', this.recent);
		emoji.packages.base.emojisByCategory.recent = this.recent;
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
			emoji.packages.base.emojisByCategory.recent,
			emoji.packages.emojiCustom.emojisByCategory.rocket,
		];

		dynamicEmojiLists.forEach((category) => {
			if (category) {
				for (let i = 0; i < category.length; i++) {
					const _emoji = category[i];
					if (!emoji.list[`:${ _emoji }:`]) {
						category = _.without(category, _emoji);
					}
				}
			}
		});
	},
};
