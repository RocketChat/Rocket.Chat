import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { callbacks } from '../../callbacks';
import { RoomManager } from '../../ui-utils';

const testIfPathAreEquals = (oldPath = '', newPath = '') => oldPath.replace(/"/g, '') === newPath;
export const roomExit = function() {
	const oldRoute = FlowRouter.current();
	Tracker.afterFlush(() => {
		const context = FlowRouter.current();

		if (oldRoute && testIfPathAreEquals(oldRoute.params.name || oldRoute.params.rid || oldRoute.params.id, context.params.name || context.params.rid || context.params.id)) {
			return;
		}
		// 7370 - Close flex-tab when opening a room on mobile UI
		if (window.matchMedia('(max-width: 500px)').matches) {
			const flex = document.querySelector('.flex-tab');
			if (flex) {
				const templateData = Blaze.getData(flex);
				templateData && templateData.tabBar && templateData.tabBar.close();
			}
		}
		callbacks.run('roomExit');

		Session.set('lastOpenedRoom', Session.get('openedRoom'));
		Session.set('openedRoom', null);
		RoomManager.openedRoom = null;

		const mainNode = document.querySelector('.main-content');
		if (mainNode == null) {
			return;
		}
		return Array.from(mainNode.children).forEach((child) => {
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
				mainNode.removeChild(child);
			}
		});
	});
	if (typeof window.currentTracker !== 'undefined') {
		window.currentTracker.stop();
	}
};
