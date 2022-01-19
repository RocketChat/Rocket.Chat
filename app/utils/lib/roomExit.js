import { Blaze } from 'meteor/blaze';
// import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { callbacks } from '../../../lib/callbacks';

const testIfPathAreEquals = (oldPath = '', newPath = '') => oldPath.replace(/"/g, '') === newPath;
export const roomExit = function () {
	const oldRoute = FlowRouter.current();
	Tracker.afterFlush(() => {
		const context = FlowRouter.current();

		if (
			oldRoute &&
			testIfPathAreEquals(
				oldRoute.params.name || oldRoute.params.rid || oldRoute.params.id,
				context.params.name || context.params.rid || context.params.id,
			)
		) {
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

		// Session.set('lastOpenedRoom', Session.get('openedRoom'));
		// Session.set('openedRoom', null);
		// RoomManager.openedRoom = null;
	});
	if (typeof window.currentTracker !== 'undefined') {
		window.currentTracker.stop();
	}
};
