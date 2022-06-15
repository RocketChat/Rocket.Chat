import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';

import { createEphemeralPortal } from '../../../../client/lib/portals/createEphemeralPortal';

const Dep = new Tracker.Dependency();

let container;
let routeComputation;
let props;
let unregister;

const createContainer = () => {
	const div = document.createElement('div');
	div.id = 'react-user-card';
	document.body.appendChild(div);
	return div;
};

export const closeUserCard = () => {
	if (!container) {
		return;
	}

	if (routeComputation) {
		routeComputation.stop();
		routeComputation = undefined;
	}

	Tracker.afterFlush(() => {
		if (unregister) {
			unregister();
			unregister = undefined;
		}
	});
};

export const openUserCard = (args) => {
	props = {
		...args,
		onClose: closeUserCard,
	};

	Dep.changed();

	container = container || createContainer();

	unregister =
		unregister ||
		createEphemeralPortal(
			() => import('../../../../client/views/room/UserCard'),
			() => {
				Dep.depend();
				return props;
			},
			container,
		);

	routeComputation =
		routeComputation ||
		Tracker.autorun((c) => {
			FlowRouter.watchPathChange();

			if (!c.firstRun) {
				closeUserCard();
			}
		});
};
