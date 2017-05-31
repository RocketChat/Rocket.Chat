'use strict';
export default () => {
	const debounce = (func, wait, immediate) => {
		let timeout;
		return function(...args) {
			const later = () => {
				timeout = null;
				!immediate && func.apply(this, args);
			};
			const callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			callNow && func.apply(this, args);
		};
	};

	const style = document.createElement('style');
	style.type = 'text/css';
	style.id = 'rocketchat-dynamic-css';

	DynamicCss = typeof DynamicCss !=='undefined'? DynamicCss : {list:[]};

	const settingBackground = (setting) => `.${ setting._id }-background { background-color: ${ setting.value }; }`;
	const settingColor = (setting) => `.${ setting._id }-color { color: ${ setting.value }; }`;

	const properties = [settingBackground, settingColor];
	const run = list => list.map(setting => properties.map(f => f(setting)).join('')).join('');

	DynamicCss.run = debounce(() => {
		const list = typeof RocketChat !== 'undefined' ? RocketChat.settings.collection.find({_id:/theme/}).fetch() : [];
		return style.innerHTML = run(list.length && list || DynamicCss.list);
	}, 1000);

	document.head.appendChild(style);
	DynamicCss.run();
};
