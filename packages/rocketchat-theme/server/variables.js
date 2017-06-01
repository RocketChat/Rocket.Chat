
// TODO: Define registers/getters/setters for packages to work with established
// 			heirarchy of colors instead of making duplicate definitions
// TODO: Settings pages to show simple separation of major/minor/addon colors
// TODO: Get major colours as swatches for minor colors in minicolors plugin
// TODO: Minicolors settings to use rgb for alphas, hex otherwise
// TODO: Add setting toggle to use defaults for minor colours and hide settings

// New colors, used for shades on solid backgrounds
// Defined range of transparencies reduces random colour variances
// Major colors form the core of the scheme
// Names changed to reflect usage, comments show pre-refactor names
const majorColors= {
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


const general = [
	{
		class: 'general-success',
		property: 'color',
		value: '#2de0a5'
	},
	{
		class: 'general-pending',
		property: 'color',
		value: '#ffd21f'
	},
	{
		class: 'general-error',
		property: 'color',
		value: '#9b3b4b'
	},
	{
		class: 'general-inactive',
		property: 'color',
		value: '#dedfe0'
	},
	{
		class: 'general-selection',
		property: 'color',
		value: '#02acec'
	}
];

general.forEach(setting => RocketChat.theme.addColor(setting.class, setting.value, 'General', setting.property));

const sidebar = [
	{
		class: 'sidebar-background',
		property: 'background-color',
		value: '#2f343d'
	},
	{
		class: 'sidebar-content',
		property: 'color',
		value: '#6c727a'
	},
	{
		class: 'sidebar-content-active',
		property: 'background-color',
		value: '#6c727a'
	},
	{
		class: 'sidebar-content-unread',
		property: 'color',
		value: '#ffffff'
	},
	{
		class: 'sidebar-content:hover',
		property: 'background-color',
		value: '#26282d'
	},
	{
		class: 'sidebar-category-badge',
		property: 'background-color',
		value: '#414852'
	},
	{
		class: 'sidebar-category-badge-content',
		property: 'color',
		value: '#ffffff'
	},
	{
		class: 'sidebar-room-badge',
		property: 'background-color',
		value: '#414852'
	},
	{
		class: 'sidebar-room-badge-content',
		property: 'color',
		value: '#ffffff'
	}
];

sidebar.forEach(setting => RocketChat.theme.addColor(setting.class, setting.value, 'Sidebar', setting.property));

const content = [
	{
		class: 'content-background',
		property: 'background-color',
		value: '#ffffff'
	},
	{
		class: 'content-color',
		property: 'color',
		value: '#414852'
	}
];

content.forEach(setting => RocketChat.theme.addColor(setting.class, setting.value, 'Content', setting.property));

// Bulk-add settings for color scheme

Object.keys(majorColors).forEach((key) => {
	const value = majorColors[key];
	RocketChat.theme.addPublicColor(key, value, 'Colors');
});

Object.keys(minorColors).forEach((key) => {
	const value = minorColors[key];
	RocketChat.theme.addPublicColor(key, value, 'Colors (minor)', 'expression');
});

RocketChat.theme.addPublicFont('body-font-family', '-apple-system, BlinkMacSystemFont, Roboto, \'Helvetica Neue\', Arial, sans-serif, \'Apple Color Emoji\', \'Segoe UI\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Meiryo UI\'');

RocketChat.settings.add('theme-custom-css', '', {
	group: 'Layout',
	type: 'code',
	code: 'text/css',
	multiline: true,
	section: 'Custom CSS',
	public: true
});
