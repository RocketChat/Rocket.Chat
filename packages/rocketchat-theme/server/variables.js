
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
		name: 'general-success',
		properties: ['background-color'],
		value: '#2de0a5'
	},
	{
		name: 'general-pending',
		properties: ['background-color'],
		value: '#ffd21f'
	},
	{
		name: 'general-error',
		properties: ['background-color'],
		value: '#f5445c'
	},
	{
		name: 'general-inactive',
		properties: ['background-color'],
		value: '#dedfe0'
	},
	{
		name: 'general-selection',
		properties: ['background-color'],
		value: '#02acec'
	}
];

general.forEach(setting => RocketChat.theme.addColor(setting.name, setting.value, 'General', setting.properties));

const sidebar = [
	{
		name: 'sidebar',
		properties: ['background-color'],
		value: '#2f343d'
	},
	{
		name: 'sidebar-content',
		properties: ['color'],
		value: '#9d9fa3'
	},
	{
		name: 'sidebar-content-active',
		properties: ['background-color', 'color', 'border-color'],
		value: '#6c727a'
	},
	{
		name: 'sidebar-content-unread',
		properties: ['color'],
		value: '#ffffff'
	},
	{
		name: 'sidebar-content-hover:hover',
		properties: ['background-color'],
		value: '#414852'
	},
	{
		name: 'sidebar-category-badge',
		properties: ['background-color'],
		value: '#414852'
	},
	{
		name: 'sidebar-category-badge-content',
		properties: ['color'],
		value: '#ffffff'
	},
	{
		name: 'sidebar-room-badge',
		properties: ['background-color'],
		value: '#1d74f5'
	},
	{
		name: 'sidebar-room-badge-content',
		properties: ['color'],
		value: '#ffffff'
	}
];

sidebar.forEach(setting => RocketChat.theme.addColor(setting.name, setting.value, 'Sidebar', setting.properties));

const content = [
	{
		name: 'content',
		properties: ['background-color'],
		value: '#ffffff'
	},
	{
		name: 'content-color',
		properties: ['color'],
		value: '#414852'
	}
];

content.forEach(setting => RocketChat.theme.addColor(setting.name, setting.value, 'Content', setting.properties));

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
