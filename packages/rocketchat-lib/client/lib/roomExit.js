/*globals currentTracker */
this.roomExit = function() {
	RocketChat.callbacks.run('roomExit');
	BlazeLayout.render('main', {
		center: 'none'
	});

	if (typeof currentTracker !== 'undefined') {
		currentTracker.stop();
	}
	const mainNode = document.querySelector('.main-content');
	if (mainNode == null) {
		return;
	}
	return [...mainNode.children].forEach(child => {
		if (child == null) {
			return;
		}
		if (child.classList.contains('room-container')) {
			const wrapper = child.querySelector('.messages-box > .wrapper');
			if (wrapper) {
				if (wrapper.scrollTop >= wrapper.scrollHeight - wrapper.clientHeight) {
					child.oldScrollTop = 10e10;
				} else {
					child.oldScrollTop = wrapper.scrollTop;
				}
			}
		}
		mainNode.removeChild(child);
	});
};
