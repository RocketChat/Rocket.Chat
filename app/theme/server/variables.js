import { theme } from './server';
import { settingsRegistry } from '../../settings/server';
// TODO: Define registers/getters/setters for packages to work with established
// 			heirarchy of colors instead of making duplicate definitions
// TODO: Settings pages to show simple separation of major/minor/addon colors
// TODO: Add setting toggle to use defaults for minor colours and hide settings

// New colors, used for shades on solid backgrounds
// Defined range of transparencies reduces random colour variances
// Major colors form the core of the scheme
// Names changed to reflect usage, comments show pre-refactor names

const variablesContent = Assets.getText('client/imports/general/variables.css');

const regionRegex = /\/\*\s*#region\s+([^ ]*?)\s+(.*?)\s*\*\/((.|\s)*?)\/\*\s*#endregion\s*\*\//gim;

for (let matches = regionRegex.exec(variablesContent); matches; matches = regionRegex.exec(variablesContent)) {
	const [, type, section, content] = matches;
	[...content.match(/--(.*?):\s*(.*?);/gim)].forEach((entry) => {
		const matches = /--(.*?):\s*(.*?);/im.exec(entry);
		const [, name, value] = matches;

		if (type === 'fonts') {
			theme.addVariable('font', name, value, 'Fonts', true);
			return;
		}

		if (type === 'colors') {
			if (/var/.test(value)) {
				const [, variableName] = value.match(/var\(--(.*?)\)/i);
				theme.addVariable('color', name, variableName, section, true, 'expression', ['color', 'expression']);
				return;
			}

			theme.addVariable('color', name, value, section, true, 'color', ['color', 'expression']);
			return;
		}

		if (type === 'less-colors') {
			if (/var/.test(value)) {
				const [, variableName] = value.match(/var\(--(.*?)\)/i);
				theme.addVariable('color', name, `@${variableName}`, section, true, 'expression', ['color', 'expression']);
				return;
			}

			theme.addVariable('color', name, value, section, true, 'color', ['color', 'expression']);
		}
	});
}

settingsRegistry.add('theme-custom-css', '', {
	group: 'Layout',
	type: 'code',
	code: 'text/css',
	multiline: true,
	section: 'Custom CSS',
	public: true,
});
