import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

import { VideoRecorder } from '../../ui';

export const VRecDialog = new (class {
	opened = false;

	dialogView = null;

	init() {
		this.dialogView = Blaze.render(Template.vrecDialog, document.body);
	}

	open(source, { rid, tmid }) {
		if (!this.dialogView) {
			this.init();
		}

		this.dialogView.templateInstance().update({
			rid,
			tmid,
			input: source.querySelector('.js-input-message'),
		});

		this.source = source;
		const dialog = $('.vrec-dialog');
		this.dialogView.templateInstance().setPosition(dialog, source);
		dialog.addClass('show');
		this.opened = true;

		return this.initializeCamera();
	}

	close() {
		$('.vrec-dialog').removeClass('show');
		this.opened = false;
		if (this.video != null) {
			return VideoRecorder.stop();
		}
	}

	initializeCamera() {
		this.video = $('.vrec-dialog video').get('0');
		if (!this.video) {
			return;
		}
		return VideoRecorder.start(this.video);
	}
})();
