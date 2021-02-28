import { Tracker } from 'meteor/tracker';

import { createEphemeralPortal } from '../../../../client/reactAdapters';
import _ from 'underscore';

const Dep = new Tracker.Dependency();

let state;
let dom;
let unregister;

const createAnchor = () => {
	const div = document.createElement('div');
	div.id = 'react-tooltip';
	document.body.appendChild(div);
	return div;
};


const props = () => {
	Dep.depend();
	return state;
};

export const closeTooltip = () => {
	if (!dom) {
		return;
	}
	unregister = unregister && unregister();
};

export const openToolTip = async (title, anchor) => {
	dom = dom || createAnchor();
	state = {
		title,
		anchor,
	};
	Dep.changed();
	unregister = unregister || await createEphemeralPortal(() => import('./TooltipComponent'), props, dom);
};

let timeout;
export const tooltipHandler = (e) => {
	timeout = timeout && clearTimeout(timeout);
	const element = e.target.title || e.dataset?.title ? e.target : e.target.closest('[title], [data-title]');
	if (element) {
		element.dataset.title = element.dataset.title || element.title;
		element.removeAttribute('title');
		timeout = setTimeout(() => {
			openToolTip(element.dataset.title, element);
		}, 100);
	}
	closeTooltip();
}

document.body.addEventListener('mouseover', _.debounce((() => {
	return (e) => {
		tooltipHandler(e)
	};
})(), 200));
