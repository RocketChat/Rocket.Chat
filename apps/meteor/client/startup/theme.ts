import type { ISetting, ISettingColor } from '@rocket.chat/core-typings';
import createLess from 'less/browser';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings } from '../../app/settings/client';

const variables = new Map();
const lessExpressions = new Map([
	['default-action-color', 'darken(@secondary-background-color, 15%)'],
	['default-action-contrast', 'contrast(@default-action-color, #444444)'],
	['primary-background-contrast', 'contrast(@primary-background-color, #444444)'],
	['primary-action-contrast', 'contrast(@primary-action-color, #444444)'],
	['secondary-background-contrast', 'contrast(@secondary-background-color, #444444)'],
	['secondary-action-contrast', 'contrast(@secondary-action-color, #444444)'],
	['selection-background', 'lighten(@selection-color, 30%)'],
	['success-background', 'lighten(@success-color, 45%)'],
	['success-border', 'lighten(@success-color, 30%)'],
	['error-background', 'lighten(@error-color, 45%)'],
	['error-border', 'lighten(@error-color, 30%)'],
	['error-contrast', 'contrast(@error-color)'],
	['pending-background', 'lighten(@pending-color, 45%)'],
	['pending-border', 'lighten(@pending-color, 30%)'],
	['transparent-darkest', 'rgba(17, 12, 12, 0.5)'],
	['transparent-darker', 'rgba(0, 0, 0, 0.15)'],
	['transparent-dark', 'rgba(15, 34, 0, 0.05)'],
	['transparent-light', 'rgba(255, 255, 255, 0.1)'],
	['transparent-lighter', 'rgba(255, 255, 255, 0.3)'],
	['transparent-lightest', 'rgba(255, 255, 255, 0.6)'],
]);

const less = createLess(window, {});

const compileLess = async (): Promise<string> => {
	if (lessExpressions.size === 0) {
		return '';
	}

	const lessCode = [
		...Array.from(variables.entries(), ([name, value]) => `@${name}: ${value};`),
		...Array.from(lessExpressions.entries(), ([name, expression]) => `@${name}: ${expression};`),
		':root {',
		...Array.from(lessExpressions.entries(), ([name]) => `--${name}: @${name};`),
		'}',
	].join('\n');

	try {
		const { css } = await less.render(lessCode);
		return css;
	} catch (error) {
		console.error(error);
		return '';
	}
};

let cssVariablesElement: HTMLStyleElement | null = null;

const updateCssVariables = _.debounce(async () => {
	if (!cssVariablesElement) {
		cssVariablesElement = document.querySelector('#css-variables');
	}

	if (!cssVariablesElement) {
		return;
	}

	cssVariablesElement.innerHTML = [
		':root {',
		...Array.from(variables.entries(), ([name, value]) => `--${name}: ${value};`),
		'}',
		await compileLess(),
	].join('\n');
}, 50);

const handleThemeColorChanged = ({ _id, value, editor }: ISettingColor): void => {
	if (typeof value !== 'string') {
		return;
	}
	try {
		const name = /^theme-color-(.*)$/.exec(_id)?.[1];

		if (!name) {
			return;
		}

		const legacy = name.slice(0, 3) !== 'rc-';

		if (editor === 'color') {
			variables.set(name, value);
			return;
		}

		if (legacy) {
			lessExpressions.set(name, value);
			return;
		}

		variables.set(name, `var(--${value})`);
	} finally {
		updateCssVariables();
	}
};

const handleThemeFontChanged = ({ _id, value }: ISetting & { value: string }): void => {
	try {
		const name = /^theme-font-(.*)$/.exec(_id)?.[1];
		if (!name) {
			return;
		}

		variables.set(name, value);
	} finally {
		updateCssVariables();
	}
};

Meteor.startup(() => {
	settings.collection.find({ _id: /^theme-color-/i }, { fields: { value: 1, editor: 1 } }).observe({
		added: handleThemeColorChanged,
		changed: handleThemeColorChanged,
	});

	settings.collection.find({ _id: /^theme-font-/i }, { fields: { value: 1 } }).observe({
		added: handleThemeFontChanged,
		changed: handleThemeFontChanged,
	});
});
