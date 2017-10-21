const majorColors = {
	'content-background-color': '#FFFFFF',
	'primary-background-color': '#04436A',
	'primary-font-color': '#444444',
	'primary-action-color': '#13679A', // was action-buttons-color
	'secondary-background-color': '#F4F4F4',
	'secondary-font-color': '#A0A0A0',
	'secondary-action-color': '#DDDDDD',
	'component-color': '#EAEAEA',
	'success-color': '#4dff4d',
	'pending-color': '#FCB316',
	'error-color': '#BC2031',
	'selection-color': '#02ACEC',
	'attention-color': '#9C27B0'
};

// Minor colours implement major colours by default, but can be overruled
// const minorColors = {
// 	'tertiary-background-color': '@component-color',
// 	'tertiary-font-color': '@transparent-lightest',
// 	'link-font-color': '@primary-action-color',
// 	'info-font-color': '@secondary-font-color',
// 	'custom-scrollbar-color': '@transparent-darker',
// 	'status-online': '@success-color',
// 	'status-away': '@pending-color',
// 	'status-busy': '@error-color',
// 	'status-offline': '@transparent-darker'
// };

const newvariables = {
	'content-background-color': 'rc-color-primary-lightest',
	'primary-background-color': 'rc-color-primary',
	'success-color': 'rc-color-success',
	'pending-color': 'rc-color-alert',
	'error-color': 'rc-color-error',
	'status-online': 'rc-color-success',
	'status-away': 'rc-color-alert',
	'status-busy': 'rc-color-error',
	'status-offline': 'rc-color-primary-darkest'
};

function lightenDarkenColor(col, amt) {
	let usePound = false;
	if (col[0] === '#') {
		col = col.slice(1);
		usePound = true;
	}

	const num = parseInt(col, 16);
	let r = (num >> 16) + amt;

	if (r > 255) { r = 255; } else if (r < 0) { r = 0; }

	let b = ((num >> 8) & 0x00FF) + amt;

	if (b > 255) { b = 255; } else if (b < 0) { b = 0; }

	let g = (num & 0x0000FF) + amt;

	if (g > 255) { g = 255; } else if (g < 0) { g = 0; }

	return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
}

RocketChat.Migrations.add({
	version: 103,
	up() {
		Object.keys(majorColors).forEach(function(_id) {
			const color = RocketChat.models.Settings.findOne({_id: `theme-color-${ _id }`});
			const key = newvariables[_id];
			if (color && color.value !== majorColors[_id] && key) {
				if (/^@.+/.test(color.value)) {
					color.value = newvariables[color.value.replace('@', '')];
				}
				const id = `theme-color-${ key }`;
				RocketChat.models.Settings.update({_id: id}, {$set: { value : color.value, editor: /^#.+/.test(color.value) ? 'color' : 'expression' }});
				if (key === 'rc-color-primary') {
					RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary-darkest'}, {$set: {editor: 'color', value: lightenDarkenColor(color.value, -16)}});
					RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary-dark'}, {$set: {editor: 'color', value: lightenDarkenColor(color.value, 18)}});
					RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary-light'}, {$set: {editor: 'color', value: lightenDarkenColor(color.value, 110)}});
					RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary-light-medium'}, {$set: {editor: 'color', value: lightenDarkenColor(color.value, 156)}});
					RocketChat.models.Settings.update({_id: 'theme-color-rc-color-primary-lightest'}, {$set: {editor: 'color', value: lightenDarkenColor(color.value, 200)}});
				}
			}
		});
	}

});
