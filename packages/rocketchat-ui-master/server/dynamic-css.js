/* global DynamicCss */

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

	const colors = setting => setting._id.indexOf('theme-color') > -1 ? `.${ setting._id.replace('theme-color-', '') }{${ setting.property }:${ setting.value }}` : '';
	const customCss = setting => setting._id.indexOf('theme-custom-css') > -1 ? setting.value : '';
	const fontFamily = setting => setting._id.indexOf('theme-font-body-font-family') > -1 ? `body{${ setting.value }}` : '';

	const properties = [fontFamily, colors, customCss];
	const run = list => list.filter(setting => setting.value && setting.property || setting.type !== 'color').map(setting => properties.reduce((ret, f) => ret || f(setting), '')).join('\n');

	DynamicCss.run = debounce(() => {
		const list = typeof RocketChat !== 'undefined' ? RocketChat.settings.collection.find({_id:/theme/}).fetch() : [];
		return style.innerHTML = run(list.length && list || DynamicCss.list);
	}, 1000);

	document.head.appendChild(style);
	DynamicCss.run();
};
