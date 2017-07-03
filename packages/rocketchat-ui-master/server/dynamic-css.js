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

	const colors = setting => {
		if (setting._id.indexOf('theme-color') > -1) {
			return setting.properties.map(property => {
				const temp = setting._id.replace('theme-color-', '').split(':');
				const settingName = temp[0];
				const pseudo = temp[1] || '';
				const propertyName = property.replace('color', '').replace('-', '');
				const className = propertyName ? `${ settingName }-${ propertyName }` : settingName;

				return `.${ className }${ pseudo ? ':' : '' }${ pseudo }{${ property }:${ setting.value }}`;
			}).join('\n');
		}

		return '';
	};


	const customCss = setting => setting._id.indexOf('theme-custom-css') > -1 ? setting.value : '';
	const fontFamily = setting => setting._id.indexOf('theme-font-body-font-family') > -1 ? `body{${ setting.value }}` : '';

	const properties = [fontFamily, colors, customCss];
	const run = list => {
		return list.filter(setting => setting.value && setting.properties || setting.type !== 'color')
			.sort((a, b) => a._id.length - b._id.length)
			.map(setting => properties.reduce((ret, f) => ret || f(setting), ''))
			.join('\n');
	};

	DynamicCss.run = debounce(() => {
		const list = typeof RocketChat !== 'undefined' ? RocketChat.settings.collection.find({_id:/theme/}).fetch() : [];
		return style.innerHTML = run(list.length && list || DynamicCss.list);
	}, 1000);

	document.head.appendChild(style);
	DynamicCss.run();
};
