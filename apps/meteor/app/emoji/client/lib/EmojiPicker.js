import _ from 'underscore';
import { Blaze } from 'meteor/blaze';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { emoji } from '../../lib/rocketchat';

let updatePositions = true;

export const EmojiPicker = {
	width: 365,
	height: 300,
	initiated: false,
	input: null,
	source: null,
	recent: [],
	tone: null,
	opened: false,
	pickCallback: null,
	scrollingToCategory: false,
	currentCategory: new ReactiveVar('recent'),
	async init() {
		if (this.initiated) {
			return;
		}

		this.initiated = true;

		this.recent = Meteor._localStorage.getItem('emoji.recent') ? Meteor._localStorage.getItem('emoji.recent').split(',') : [];
		this.tone = Meteor._localStorage.getItem('emoji.tone') || 0;

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

		$(window).resize(
			_.debounce(() => {
				if (!this.opened) {
					return;
				}
				this.setPosition();
			}, 300),
		);
	},
	isOpened() {
		return this.opened;
	},
	setTone(tone) {
		this.tone = tone;
		Meteor._localStorage.setItem('emoji.tone', tone);
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
			cssProperties.top = windowHeight - this.height - windowBorder - 75;
		}

		if (left < windowBorder) {
			cssProperties.left = isLargerThanWindow ? 0 : windowBorder;
		}

		if (left + this.width >= windowWidth) {
			cssProperties.left = isLargerThanWindow ? 0 : windowWidth - this.width - windowBorder;
		}

		return $('.emoji-picker').css(cssProperties);
	},
	async open(source, callback) {
		if (!this.initiated) {
			await this.init();
		}
		this.pickCallback = callback;
		this.source = source;

		const containerEl = this.setPosition();
		containerEl.addClass('show');

		const emojiInput = containerEl.find('.js-emojipicker-search');
		if (emojiInput) {
			emojiInput.focus();
		}

		this.calculateCategoryPositions();

		if (this.recent.length === 0 && this.currentCategory.get() === 'recent') {
			this.showCategory(emoji.packages.emojiCustom.list.length > 0 ? 'rocket' : 'people', false);
		}

		this.opened = true;
	},
	close() {
		$('.emoji-picker').removeClass('show');
		this.opened = false;
		this.source.focus();
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

		// limit recent emojis to 27 (3 rows of 9)
		this.recent.splice(27);

		updatePositions = true;

		Meteor._localStorage.setItem('emoji.recent', this.recent);
		emoji.packages.base.emojisByCategory.recent = this.recent;
		this.updateRecent('recent');
	},
	removeFromRecent(_emoji) {
		const pos = this.recent.indexOf(_emoji);
		if (pos === -1) {
			return;
		}
		this.recent.splice(pos, 1);
		Meteor._localStorage.setItem('emoji.recent', this.recent);
	},
	async updateRecent(category) {
		const emojiPickerImport = await import('../emojiPicker');
		const { updateRecentEmoji } = emojiPickerImport;
		updateRecentEmoji(category);
	},
	calculateCategoryPositions() {
		if (!updatePositions) {
			return;
		}
		updatePositions = false;

		const containerScroll = $('.emoji-picker .emojis').scrollTop();

		this.catPositions = Array.from(document.querySelectorAll('.emoji-list-category')).map((el) => {
			const { top } = $(el).position();
			return {
				el,
				top: top + containerScroll,
			};
		});
	},
	getCategoryPositions() {
		return this.catPositions;
	},
	showCategory(category, animate = true) {
		this.scrollingToCategory = animate;

		$('.emoji-picker .js-emojipicker-search').val('').change().focus();

		this.currentCategory.set(category);

		Tracker.afterFlush(() => {
			const header = $(`#emoji-list-category-${category}`);
			const container = $('.emoji-picker .emojis');

			const scrollTop = header.position().top + container.scrollTop(); // - container.position().top;

			if (animate) {
				return container.animate(
					{
						scrollTop,
					},
					300,
					() => {
						this.scrollingToCategory = false;
					},
				);
			}

			container.scrollTop(scrollTop);
		});
	},
};
