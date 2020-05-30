import _ from 'underscore';
import EventEmitter from 'wolfy87-eventemitter';

import { menu } from '../../../ui-utils';

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

emitter.on('grid', () => {
	menu.close();
});
