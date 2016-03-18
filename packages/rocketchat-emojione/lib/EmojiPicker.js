/* globals EmojiPicker:true, emojione, Blaze, Template */
EmojiPicker = {
	width: 390,
	height: 203,
	initiated: false,
	input: null,
	recent: [],
	tone: null,
	opened: false,
	init() {
		if (this.initiated) {
			return;
		}
		this.initiated = true;

		this.recent = window.localStorage.getItem('emoji.recent') ? window.localStorage.getItem('emoji.recent').split(',') : [];
		this.tone = window.localStorage.getItem('emoji.tone') || 0;

		Blaze.render(Template.emojiPicker, document.body);

		$(document).click((event) => {
			if(!$(event.target).closest('.emoji-picker').length && !$(event.target).is('.emoji-picker')) {
				if (this.opened) {
					this.close();
				}
			}
		});
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
	open(source, input) {
		if (!this.initiated) {
			this.init();
		}
		this.input = input;
		let sourcePos = $(source).offset();
		$('.emoji-picker')
			.css({
				top: (sourcePos.top - this.height - 10) + 'px',
				left: (sourcePos.left - this.width + 50) + 'px'
			})
			.addClass('show');

		this.opened = true;
	},
	close() {
		$('.emoji-picker').removeClass('show');
		this.opened = false;
	},
	insertEmoji(emoji) {
		let emojiValue = ':' + emoji + ':';

		var caretPos = this.input.prop('selectionStart');
		var textAreaTxt = this.input.val();

		this.input.val(textAreaTxt.substring(0, caretPos) + emojiValue + textAreaTxt.substring(caretPos) );

		this.input.focus();

		this.input.prop('selectionStart', caretPos + emojiValue.length);
		this.input.prop('selectionEnd', caretPos + emojiValue.length);

		this.close();
		this.addRecent(emoji);
	},
	addRecent(emoji) {
		let pos = this.recent.indexOf(emoji);

		if (pos !== -1) {
			this.recent.splice(pos, 1);
		}

		this.recent.unshift(emoji);

		window.localStorage.setItem('emoji.recent', this.recent);

		this.updateRecent();
	},
	updateRecent() {
		let total = this.recent.length;
		var html = '';
		for (var i = 0; i < total; i++) {
			let emoji = this.recent[i];
			let tone = '';

			html += '<li class="emoji-' + emoji + '" data-emoji="' + emoji + '">' + emojione.toImage(':' + emoji + tone + ':') + '</li>';
		}
		$('.recent.emoji-list').html(html);
	}
};
