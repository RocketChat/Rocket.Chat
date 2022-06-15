import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';

const testIfPathAreEquals = (oldPath = '', newPath = ''): boolean => oldPath.replace(/"/g, '') === newPath;
export const roomExit = function (_context: { params: Record<string, string>; queryParams: Record<string, string> }): void {
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
			const flex = document.querySelector<HTMLElement>('.flex-tab');
			if (flex) {
				const templateData = Blaze.getData(flex) as any;
				templateData?.tabBar?.close();
			}
		}
	});

	if (typeof (window as any).currentTracker !== 'undefined') {
		(window as any).currentTracker.stop();
	}
};
