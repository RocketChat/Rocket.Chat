this.popover = {
	close() {
		document.querySelectorAll('[data-popover="anchor"]:checked').forEach((checkbox) => {
			checkbox.checked = false;
		});
	}
};
