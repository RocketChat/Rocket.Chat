
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

const reg = /--(rc-color-.*?): (.*?);/igm;

const colors = [...Assets.getText('client/imports/general/variables.css').match(reg)].map((color) => {
	const [name, value] = color.split(': ');
	return [name.replace('--', ''), value.replace(';', '')];
});

colors.forEach(([key, color]) => 	{
	let category = 'Colors';
	if (/darkmode/.test(key)) {
		category = 'Colors (dark mode)';
	}

	if (/var/.test(color)) {
		const [, value] = color.match(/var\(--(.*?)\)/i);
		return RocketChat.theme.addPublicColor(key, value, category, 'expression');
	}
	RocketChat.theme.addPublicColor(key, color, category);
});

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
	'attention-color': '#9C27B0',
};

// Minor colours implement major colours by default, but can be overruled
const minorColors = {
	'tertiary-background-color': '@component-color',
	'tertiary-font-color': '@transparent-lightest',
	'link-font-color': '@primary-action-color',
	'info-font-color': '@secondary-font-color',
	'custom-scrollbar-color': '@transparent-darker',
	'status-online': '@success-color',
	'status-away': '@pending-color',
	'status-busy': '@error-color',
	'status-offline': '@transparent-darker',
};

// Dark mode
const majorDarkColors = {
	'darkmode-content-background-color': '#1E1E1E',
	'darkmode-primary-background-color': '#224D79',
	'darkmode-primary-font-color': '#CCCCCC',
	'darkmode-primary-action-color': '#13679A', // was action-buttons-color
	'darkmode-secondary-background-color': '#323232',
	'darkmode-secondary-font-color': '#606060',
	'darkmode-secondary-action-color': '#222222',
	'darkmode-component-color': '#1F1F1F',
	'darkmode-success-color': '#0CAC0C',
	'darkmode-pending-color': '#FCB316',
	'darkmode-error-color': '#BC2031',
	'darkmode-selection-color': '#066C92',
	'darkmode-attention-color': '#913CA0',
};

// Minor colours implement major colours by default, but can be overruled
const minorDarkColors = {
	'darkmode-tertiary-background-color': '@darkmode-component-color',
	'darkmode-tertiary-font-color': '@transparent-lightest',
	'darkmode-link-font-color': '@darkmode-primary-action-color',
	'darkmode-info-font-color': '@darkmode-secondary-font-color',
	'darkmode-custom-scrollbar-color': '@transparent-darker',
	'darkmode-status-online': '@darkmode-success-color',
	'darkmode-status-away': '@darkmode-pending-color',
	'darkmode-status-busy': '@darkmode-error-color',
	'darkmode-status-offline': '@transparent-darker',
};

// Bulk-add settings for color scheme
Object.keys(majorColors).forEach((key) => {
	const value = majorColors[key];
	RocketChat.theme.addPublicColor(key, value, 'Old Colors');
});

Object.keys(minorColors).forEach((key) => {
	const value = minorColors[key];
	RocketChat.theme.addPublicColor(key, value, 'Old Colors (minor)', 'expression');
});

Object.keys(majorDarkColors).forEach((key) => {
	const value = majorDarkColors[key];
	RocketChat.theme.addPublicColor(key, value, 'Old Colors (dark mode)');
});

Object.keys(minorDarkColors).forEach((key) => {
	const value = minorDarkColors[key];
	RocketChat.theme.addPublicColor(key, value, 'Old Colors (dark mode, minor)', 'expression');
});

RocketChat.theme.addPublicFont('body-font-family', '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Helvetica Neue\', \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Meiryo UI\', Arial, sans-serif');

RocketChat.settings.add('theme-custom-css', '', {
	group: 'Layout',
	type: 'code',
	code: 'text/css',
	multiline: true,
	section: 'Custom CSS',
	public: true,
});

