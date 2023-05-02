import { Blaze } from 'meteor/blaze';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { emoji } from '../lib';
import { updateRecentEmoji } from '../emojiPicker';
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';

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

		document.addEventListener('click', (event) => {
			if (!this.opened) {
				return;
			}
			if (!event.target.closest('.emoji-picker') && !event.target.matches('.emoji-picker')) {
				if (this.opened) {
					this.close();
				}
			}
		});

		window.addEventListener(
			'resize',
			withDebouncing({ wait: 300 })(() => {
				if (!this.opened) {
					return;
				}
				this.setPosition();
			}),
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

		// get the position of the source element
		let { left, top } = this.source.getBoundingClientRect();
		left += window.scrollX;
		top += window.scrollY;

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

		const emojiPickerElement = document.querySelector('.emoji-picker');
		emojiPickerElement.style.top = `${cssProperties.top}px`;
		emojiPickerElement.style.left = `${cssProperties.left}px`;

		return emojiPickerElement;
	},
	/**
	 * @param {Element} source
	 * @param {(emoji: string) => void} callback
	 */
	async open(source, callback) {
		if (!this.initiated) {
			await this.init();
		}
		this.pickCallback = callback;
		this.source = source;

		const containerEl = this.setPosition();
		containerEl.classList.add('show');

		const emojiInput = containerEl.querySelector('.js-emojipicker-search');
		emojiInput?.focus();

		this.calculateCategoryPositions();

		if (this.recent.length === 0 && this.currentCategory.get() === 'recent') {
			this.showCategory(emoji.packages.emojiCustom.list.length > 0 ? 'rocket' : 'people', false);
		}

		this.opened = true;
	},
	close() {
		const emojiPickerElement = document.querySelector('.emoji-picker');
		emojiPickerElement.classList.remove('show');
		this.opened = false;
		this.source.focus();
	},
	pickEmoji(emoji) {
		this.close();
		this.addRecent(emoji);
		this.pickCallback(emoji);
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
	updateRecent(category) {
		updateRecentEmoji(category);
	},
	calculateCategoryPositions() {
		if (!updatePositions) {
			return;
		}
		updatePositions = false;

		const emojisElement = document.querySelector('.emoji-picker .emojis');

		this.catPositions = Array.from(document.querySelectorAll('.emoji-list-category')).map((el) => {
			return {
				el,
				top: el.offsetTop + emojisElement.scrollTop,
			};
		});
	},
	getCategoryPositions() {
		return this.catPositions;
	},
	showCategory(category, animate = true) {
		this.scrollingToCategory = animate;

		const emojiPickerSearchElement = document.querySelector('.emoji-picker .js-emojipicker-search');
		emojiPickerSearchElement.value = '';
		emojiPickerSearchElement.dispatchEvent(new Event('change'));
		emojiPickerSearchElement.focus();

		this.currentCategory.set(category);

		Tracker.afterFlush(() => {
			const header = document.querySelector(`#emoji-list-category-${category}`);
			const container = document.querySelector('.emoji-picker .emojis');

			if (animate) {
				header.scrollIntoView({ behavior: 'smooth', block: 'start' });

				const callback = () => {
					this.scrollingToCategory = false;
				};

				if ('onscrollend' in window) {
					container.addEventListener('scrollend', callback, { once: true });
				} else {
					let scrollEndTimer;
					const handler = () => {
						clearTimeout(scrollEndTimer);
						scrollEndTimer = setTimeout(() => {
							callback();
							container.removeEventListener('scroll', handler);
						}, 100);
					};
					container.addEventListener('scroll', handler);
				}

				return;
			}

			header.scrollIntoView({ block: 'start' });
		});
	},
};
