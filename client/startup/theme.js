import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings } from '../../app/settings/client';

const variables = new Map();

const updateCssVariables = _.debounce(() => {
	document.querySelector('#css-variables').innerHTML = [
		':root {',
		...Array.from(variables.entries()).map(([name, value]) => `--${ name }: ${ value };`),
		'}',
	].join('\n');

	window.cssVarPoly.init();
}, 50);

const handleThemeColorChanged = ({ _id, value, editor }) => {
	try {
		const name = /^theme-color-(.*)$/.exec(_id)[1];
		const legacy = name.slice(3) !== 'rc-';

		if (editor === 'color') {
			variables.set(name, value);
			return;
		}

		if (legacy) {
			return;
		}

		variables.set(name, `var(--${ value })`);
	} finally {
		updateCssVariables();
	}
};

Meteor.startup(() => {
	settings.collection.find({ _id: /^theme-color-/i }, { fields: { value: 1, editor: 1 } }).observe({
		added: handleThemeColorChanged,
		changed: handleThemeColorChanged,
	});
});
