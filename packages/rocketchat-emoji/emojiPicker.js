/* globals Template, isSetNotNull */
var emojiCategories = {};
/**
 * Turns category hash to a nice readable translated name
 * @param {string} category hash
 * @return {string} readable and translated
 */
function categoryName(category) {
	for (let emojiPackage in RocketChat.emoji.packages) {
		if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
			if (RocketChat.emoji.packages[emojiPackage].emojiCategories.hasOwnProperty(category)) {
				return RocketChat.emoji.packages[emojiPackage].emojiCategories[category];
			}
		}
	}
	if (emojiCategories.hasOwnProperty(category)) {
		return emojiCategories[category];
	}
	// unknown category; better hash than nothing
	return category;
}

function getEmojisByCategory(category) {
	const t = Template.instance();
	const actualTone = t.tone;
	let html = '';
	for (let emojiPackage in RocketChat.emoji.packages) {
		if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
			if (RocketChat.emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(category)) {
				let total = RocketChat.emoji.packages[emojiPackage].emojisByCategory[category].length;
				for (let i = 0; i < total; i++) {
					let emoji = RocketChat.emoji.packages[emojiPackage].emojisByCategory[category][i];
					let tone = '';

					if (actualTone > 0 && RocketChat.emoji.packages[emojiPackage].toneList.hasOwnProperty(emoji)) {
						tone = '_tone' + actualTone;
					}

					//set correctPackage here to allow for recent emojis to work properly
					if (isSetNotNull(() => RocketChat.emoji.list[`:${emoji}:`].emojiPackage)) {
						let correctPackage = RocketChat.emoji.list[`:${emoji}:`].emojiPackage;

						const image = RocketChat.emoji.packages[correctPackage].render(`:${emoji}${tone}:`);

						html += `<li class="emoji-${emoji}" data-emoji="${emoji}" title="${emoji}">${image}</li>`;
					}
				}
			}
		}
	}
	return html;
}

function getEmojisBySearchTerm(searchTerm) {
	let html = '';
	const t = Template.instance();
	const actualTone = t.tone;

	let searchRegExp = new RegExp(RegExp.escape(searchTerm.replace(/:/g, '')), 'i');

	for (let emoji in RocketChat.emoji.list) {
		if (!RocketChat.emoji.list.hasOwnProperty(emoji)) {
			continue;
		}

		if (searchRegExp.test(emoji)) {
			let emojiObject = RocketChat.emoji.list[emoji];
			let emojiPackage = emojiObject.emojiPackage;
			let tone = '';
			emoji = emoji.replace(/:/g, '');

			if (actualTone > 0 && RocketChat.emoji.packages[emojiPackage].toneList.hasOwnProperty(emoji)) {
				tone = '_tone' + actualTone;
			}

			let emojiFound = false;

			for (let key in RocketChat.emoji.packages[emojiPackage].emojisByCategory) {
				if (RocketChat.emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(key)) {
					let contents = RocketChat.emoji.packages[emojiPackage].emojisByCategory[key];
					if (contents.indexOf(emoji) !== -1) {
						emojiFound = true;
						break;
					}
				}
			}

			if (emojiFound) {
				let image = RocketChat.emoji.packages[emojiPackage].render(`:${emoji}${tone}:`);
				html += `<li class="emoji-${emoji}" data-emoji="${emoji}" title="${emoji}">${image}</li>`;
			}
		}
	}

	return html;
}

Template.emojiPicker.helpers({
	category() {
		let categories = [];
		for (let emojiPackage in RocketChat.emoji.packages) {
			if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
				for (let key in RocketChat.emoji.packages[emojiPackage].emojisByCategory) {
					if (RocketChat.emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(key)) {
						categories.push(key);
					}
				}
			}
		}
		return categories;
	},
	emojiByCategory(category) {
		let emojisByCategory = [];
		for (let emojiPackage in RocketChat.emoji.packages) {
			if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
				if (RocketChat.emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(category)) {
					emojisByCategory = emojisByCategory.concat(RocketChat.emoji.packages[emojiPackage].emojisByCategory[category]);
				}
			}
		}
		return emojisByCategory;
	},
	isVisible(category) {
		return Template.instance().currentCategory.get() === category ? 'visible' : '';
	},
	emojiList(category) {
		const t = Template.instance();
		const searchTerm = t.currentSearchTerm.get();

		//clear dynamic categories to prevent duplication issues
		if (category === 'recent' || category === 'rocket') {
			$(`.${category}.emoji-list`).empty();
		}

		if (searchTerm.length > 0) {
			return getEmojisBySearchTerm(searchTerm);
		} else {
			return getEmojisByCategory(category);
		}
	},
	currentTone() {
		return 'tone-' + Template.instance().tone;
	},
	/**
	 * Returns true if a given emoji category is active
	 *
	 * @param {string} category hash
	 * @return {boolean} true if active, false otherwise
	 */
	activeCategory(category) {
		return Template.instance().currentCategory.get() === category ? 'active' : '';
	},
	categoryName: categoryName,
	/**
	 * Returns currently active emoji category hash
	 *
	 * @return {string} category hash
	 */
	currentCategory() {
		const t = Template.instance();
		const hash = t.currentCategory.get();
		const searchTerm = t.currentSearchTerm.get();

		if (searchTerm.length > 0) {
			return TAPi18n.__('Search');
		} else {
			return categoryName(hash);
		}
	}
});

Template.emojiPicker.events({
	'click .emoji-picker'(event) {
		event.stopPropagation();
		event.preventDefault();
	},
	'click .category-link'(event, instance) {
		event.stopPropagation();
		event.preventDefault();

		instance.currentCategory.set(event.currentTarget.hash.substr(1));

		return false;
	},
	'click .change-tone > a'(event, instance) {
		event.stopPropagation();
		event.preventDefault();

		instance.$('.tone-selector').toggleClass('show');
	},
	'click .tone-selector .tone'(event, instance) {
		event.stopPropagation();
		event.preventDefault();

		let tone = parseInt(event.currentTarget.dataset.tone);
		let newTone;

		if (tone > 0) {
			newTone = '_tone' + tone;
		} else {
			newTone = '';
		}

		for (let emojiPackage in RocketChat.emoji.packages) {
			if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
				if (RocketChat.emoji.packages[emojiPackage].hasOwnProperty('toneList')) {
					for (let emoji in RocketChat.emoji.packages[emojiPackage].toneList) {
						if (RocketChat.emoji.packages[emojiPackage].toneList.hasOwnProperty(emoji)) {
							$('.emoji-'+emoji).html(RocketChat.emoji.packages[emojiPackage].render(':' + emoji + newTone + ':'));
						}
					}
				}
			}
		}

		RocketChat.EmojiPicker.setTone(tone);

		instance.setCurrentTone(tone);

		$('.tone-selector').toggleClass('show');
	},
	'click .emoji-list li'(event, instance) {
		event.stopPropagation();

		let emoji = event.currentTarget.dataset.emoji;
		let actualTone = instance.tone;
		let tone = '';

		for (let emojiPackage in RocketChat.emoji.packages) {
			if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
				if (actualTone > 0 && RocketChat.emoji.packages[emojiPackage].toneList.hasOwnProperty(emoji)) {
					tone = '_tone' + actualTone;
				}
			}
		}

		const input = $('.emoji-filter input.search');
		if (input) {
			input.val('');
		}
		instance.currentSearchTerm.set('');

		RocketChat.EmojiPicker.pickEmoji(emoji + tone);
	},
	'keydown .emoji-filter .search'(event) {
		if (event.keyCode === 13) {
			event.preventDefault();
		}
	},
	'keyup .emoji-filter .search'(event, instance) {
		const value = event.target.value.trim();
		const cst = instance.currentSearchTerm;
		if (value === cst.get()) {
			return;
		}
		cst.set(value);
	}
});

Template.emojiPicker.onCreated(function() {
	this.tone = RocketChat.EmojiPicker.getTone();
	let recent = RocketChat.EmojiPicker.getRecent();

	this.currentCategory = new ReactiveVar(recent.length > 0 ? 'recent' : 'people');
	this.currentSearchTerm = new ReactiveVar('');

	recent.forEach((emoji) => {
		RocketChat.emoji.packages.base.emojisByCategory.recent.push(emoji);
	});

	this.setCurrentTone = (newTone) => {
		$('.current-tone').removeClass('tone-' + this.tone);
		$('.current-tone').addClass('tone-' + newTone);
		this.tone = newTone;
	};
});
