import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

export const ScreenSharinDialog = new class {
	opened = false;

	dialogView = null;

	init() {
		this.dialogView = Blaze.render(Template.screenSharinDialog, document.body);
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
		const dialog = $('.screensharing-dialog');
		this.dialogView.templateInstance().setPosition(dialog, source);
		dialog.addClass('show');
		this.opened = true;
	}

	close() {
		$('.screensharing-dialog').removeClass('show');
		this.opened = false;
	}
}();
