import _ from 'underscore';
import { menu as _menu } from 'meteor/rocketchat:ui-utils';

window.addEventListener('resize', _.debounce((() => {
	let lastState = window.matchMedia('(min-width: 780px)').matches ? 'mini' : 'large';
	RocketChat.emit('grid', lastState);
	return () => {
		const futureState = window.matchMedia('(min-width: 780px)').matches ? 'mini' : 'large';
		if (lastState !== futureState) {
			lastState = futureState;
			RocketChat.emit('grid', lastState);
		}
	};
})(), 100));

this.menu = _menu;

RocketChat.on('grid', () => {
	this.menu.close();
});
