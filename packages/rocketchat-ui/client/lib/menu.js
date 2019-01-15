import _ from 'underscore';
import { menu as _menu } from 'meteor/rocketchat:ui-utils';
import EventEmitter from 'wolfy87-eventemitter';

const emitter = new EventEmitter();

window.addEventListener('resize', _.debounce((() => {
	let lastState = window.matchMedia('(min-width: 780px)').matches ? 'mini' : 'large';
	emitter.emit('grid', lastState);
	return () => {
		const futureState = window.matchMedia('(min-width: 780px)').matches ? 'mini' : 'large';
		if (lastState !== futureState) {
			lastState = futureState;
			emitter.emit('grid', lastState);
		}
	};
})(), 100));

this.menu = _menu;

emitter.on('grid', () => {
	_menu.close();
});
