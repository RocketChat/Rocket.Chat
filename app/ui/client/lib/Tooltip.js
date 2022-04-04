import { Tracker } from 'meteor/tracker';

import { createEphemeralPortal } from '../../../../client/lib/portals/createEphemeralPortal';
import { createAnchor } from '../../../../client/lib/utils/createAnchor';

const Dep = new Tracker.Dependency();

let state;
let dom;
let unregister;

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

export const openToolTip = (title, anchor) => {
	dom = dom || createAnchor('react-tooltip');
	state = {
		title,
		anchor,
	};
	Dep.changed();
	unregister = unregister || createEphemeralPortal(() => import('../../../../client/components/TooltipComponent'), props, dom);
};

window.matchMedia('(hover: none)').matches ||
	document.body.addEventListener(
		'mouseover',
		(() => {
			let timeout;
			return (e) => {
				timeout = timeout && clearTimeout(timeout);
				timeout = setTimeout(() => {
					const element = e.target.title || e.dataset?.title ? e.target : e.target.closest('[title], [data-title]');
					if (element) {
						element.dataset.title = element.title || element.dataset.title;
						element.removeAttribute('title');
						openToolTip(element.dataset.title, element);
					}
				}, 300);
				closeTooltip();
			};
		})(),
	);
