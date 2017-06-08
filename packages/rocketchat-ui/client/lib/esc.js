const escapify = {
	init() {
		const that = this;
		document.addEventListener('keyup', (event) => {
			const keyName = event.key;
			if (keyName === 'Escape') {
				that.sideNavIcon();
				that.flextTabButton();
				that.videoDialog();
				that.sweetAlerts();
			}
		}, false);
	},

	getClickEvent() {
		return new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window
		});
	},

	flextTabButton() {
		const flextTabButton = document.querySelector('.flex-tab-bar .tab-button.active');
		if (flextTabButton) {
			flextTabButton.dispatchEvent(this.getClickEvent());
			return;
		}
	},

	sideNavIcon() {
		const sideNavArrow = document.querySelector('.sidebar .arrow');
		if (sideNavArrow && (sideNavArrow.classList.contains('top') || sideNavArrow.classList.contains('close'))) {
			SideNav.toggleCurrent();
			return;
		}
	},

	videoDialog() {
		const vrecDialog = document.querySelector('.vrec-dialog');
		if (vrecDialog && Number(window.getComputedStyle(vrecDialog).opacity) === 1) {
			VideoRecorder.stop();
			VRecDialog.close();
			return;
		}
	},

	sweetAlerts() {
		const sweetAlert = document.querySelector('.sweet-alert');
		if (sweetAlert) {
			document.querySelector('.sweet-alert .sa-button-container .cancel').dispatchEvent(this.getClickEvent());
			return;
		}
	}
};

this.escapify = escapify;
this.escapify.init();
