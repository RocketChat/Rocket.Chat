import { theme } from './server';
import { settings } from '../../settings';
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
	if (/var/.test(color)) {
		const [, value] = color.match(/var\(--(.*?)\)/i);
		return theme.addPublicColor(key, value, 'Colors', 'expression');
	}
	theme.addPublicColor(key, color, 'Colors');
});

const majorColors = {
	'content-background-color': '#FFFFFF',
	'primary-background-color': '#04436A',
	'primary-font-color': '#444444',
	'primary-action-color': '#1d74f5', // was action-buttons-color
	'secondary-background-color': '#F4F4F4',
	'secondary-font-color': '#A0A0A0',
	'secondary-action-color': '#DDDDDD',
	'component-color': '#f2f3f5',
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

// Bulk-add settings for color scheme
Object.keys(majorColors).forEach((key) => {
	const value = majorColors[key];
	theme.addPublicColor(key, value, 'Old Colors');
});

Object.keys(minorColors).forEach((key) => {
	const value = minorColors[key];
	theme.addPublicColor(key, value, 'Old Colors (minor)', 'expression');
});

theme.addPublicFont('body-font-family', '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Helvetica Neue\', \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Meiryo UI\', Arial, sans-serif');

settings.add('theme-custom-css', '', {
	group: 'Layout',
	type: 'code',
	code: 'text/css',
	multiline: true,
	section: 'Custom CSS',
	public: true,
});
