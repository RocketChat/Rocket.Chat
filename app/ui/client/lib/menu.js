import _ from 'underscore';
import { menu } from '/app/ui-utils';
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

emitter.on('grid', () => {
	menu.close();
});
