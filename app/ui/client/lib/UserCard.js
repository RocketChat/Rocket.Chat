import { Tracker } from 'meteor/tracker';

import { createEphemeralPortal } from '../../../../client/reactAdapters';

const Dep = new Tracker.Dependency();
let state;
let dom;
let unregister;
const createAchor = () => {
	const div = document.createElement('div');
	div.id = 'react-user-card';
	document.body.appendChild(div);
	return div;
};


export const closeUserCard = () => {
	if (!dom) {
		return;
	}
	Tracker.afterFlush(() => {
		unregister = unregister && unregister();
	});
};

const props = () => {
	Dep.depend();
	return state;
};

export const openUserCard = async ({ ...args }) => {
	dom = dom || createAchor();
	state = {
		onClose: closeUserCard,
		...args,
	};
	Dep.changed();
	unregister = unregister || await createEphemeralPortal(() => import('../../../../client/channel/UserCard'), props, dom);
};
