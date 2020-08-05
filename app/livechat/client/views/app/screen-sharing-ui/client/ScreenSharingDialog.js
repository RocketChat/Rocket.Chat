import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

export const ScreenSharingDialog = new class {
	opened = false;

	dialogView = null;

	source = null;

	rid = null;

	src = null;

	init() {
		this.dialogView = Blaze.render(Template.screenSharingDialog, document.body);
	}

	open(source, { rid, src }) {
		if (!this.dialogView) {
			this.init();
		}

		this.dialogView.templateInstance().update({
			rid,
			input: source.querySelector('.js-input-message'),
			src,
		});

		this.source = source;
		const dialog = $('.screensharing-dialog');
		this.dialogView.templateInstance().setPosition(dialog, source);
		dialog.addClass('show');
		this.opened = true;
	}

	maximize() {
		const dialog = $('.screensharing-dialog');
		this.dialogView.templateInstance().maximizeWindow(dialog);
	}

	minimize() {
		const dialog = $('.screensharing-dialog');
		this.dialogView.templateInstance().setPosition(dialog, this.source);
	}

	close() {
		$('.screensharing-dialog').removeClass('show');
		this.opened = false;
	}
}();
