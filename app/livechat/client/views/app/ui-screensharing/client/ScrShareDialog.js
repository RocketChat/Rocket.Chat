import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

export const ScrShareDialog = new class {
	opened = false;

	dialogView = null;

	init() {
		this.dialogView = Blaze.render(Template.scrshareDialog, document.body);
	}

	open(source, { rid, tmid, src }) {
		if (!this.dialogView) {
			this.init();
		}

		this.dialogView.templateInstance().update({
			rid,
			tmid,
			input: source.querySelector('.js-input-message'),
			src,
		});

		this.source = source;
		const dialog = $('.scrshare-dialog');
		this.dialogView.templateInstance().setPosition(dialog, source);
		dialog.addClass('show');
		this.opened = true;
	}

	close() {
		$('.scrshare-dialog').removeClass('show');
		this.opened = false;
		// if (this.video != null) {
		// }
	}
}();
