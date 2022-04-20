import _ from 'underscore';

import { menu } from '../../../ui-utils';

window.addEventListener(
	'resize',
	_.debounce(
		(() => {
			let lastState = window.matchMedia('(min-width: 780px)').matches ? 'mini' : 'large';
			menu.close();
			return () => {
				const futureState = window.matchMedia('(min-width: 780px)').matches ? 'mini' : 'large';
				if (lastState !== futureState) {
					lastState = futureState;
					menu.close();
				}
			};
		})(),
		100,
	),
);
