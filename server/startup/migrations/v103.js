
const majorColors= {
	'content-background-color': '#FFFFFF',
	'primary-background-color': 'color-primary',
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
const minorColors= {
	'tertiary-background-color': '@component-color',
	'tertiary-font-color': '@transparent-lightest',
	'link-font-color': '@primary-action-color',
	'info-font-color': '@secondary-font-color',
	'custom-scrollbar-color': '@transparent-darker',
	'status-online': '@success-color',
	'status-away': '@pending-color',
	'status-busy': '@error-color',
	'status-offline': '@transparent-darker'
};

const newvariables = {
	'content-background-color': 'color-primary',
	'primary-background-color': 'color-primary'
};
RocketChat.Migrations.add({
	version: 103,
	up() {
		// Object.keys(majorColors).forEach(function (_id) {
		// 	const color = RocketChat.models.Settings.findOne({_id});
		// 	// RocketChat.models.Settings.remove(color);
		// 	if(color.value !== majorColors[key] && newvariables[key]){
		// 		const _id = `theme-color-${ key }`;
		// 		RocketChat.models.Settings.update({_id}, {$set: { value : color.value, editor: color.editor }});
		// 	}
		// });
		// Object.keys(minorColors).forEach(function (_id) {
		// 	const color = RocketChat.models.Settings.findOne({_id});
		// 	RocketChat.models.Settings.remove(color);
		// });

	}
});
