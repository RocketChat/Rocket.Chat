import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

export const ScreenSharinDialog = new class {
	opened = false;

	windowMaximized = false;

	dialogView = null;

	source = null;

	rid = null;

	src = null;

	init() {
		this.dialogView = Blaze.render(Template.screenSharinDialog, document.body);
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
		this.windowMaximized = false;
	}

	maximize() {
		const dialog = $('.screensharing-dialog');
		this.dialogView.templateInstance().maximizeWindow(dialog, this.source);
		this.windowMaximized = true;
	}

	minimize() {
		const dialog = $('.screensharing-dialog');
		this.dialogView.templateInstance().setPosition(dialog, this.source);
		this.windowMaximized = false;
	}

	close() {
		$('.screensharing-dialog').removeClass('show');
		this.opened = false;
		this.windowMaximized = false;
	}
}();
