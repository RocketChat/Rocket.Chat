export const VRecDialog = new class {
	static initClass() {
		this.prototype.opened = false;
		this.prototype.initiated = false;
		this.prototype.width = 400;
		this.prototype.height = 280;
	}

	init() {
		if (this.initiated) {
			return;
		}

		this.initiated = true;
		return Blaze.render(Template.vrecDialog, document.body);
	}

	open(source) {
		if (!this.initiated) {
			this.init();
		}

		this.source = source;
		const dialog = $('.vrec-dialog');
		this.setPosition(dialog, source);
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

	setPosition(dialog, source) {
		const sourcePos = $(source).offset();
		let left = (sourcePos.left - this.width) + 100;
		let top = sourcePos.top - this.height - 40;

		if (left < 0) {
			left = 10;
		}
		if (top < 0) {
			top = 10;
		}

		return dialog.css({ top: `${ top }px`, left: `${ left }px` });
	}

	initializeCamera() {
		this.video = $('.vrec-dialog video').get('0');
		if (!this.video) {
			return;
		}
		return VideoRecorder.start(this.video);
	}
};
