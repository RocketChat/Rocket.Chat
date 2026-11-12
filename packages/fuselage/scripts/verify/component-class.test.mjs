import assert from 'node:assert/strict';
import { test } from 'node:test';

import { rootClass } from './component-class.mjs';

test('the root class comes from the component sources, not from its name', () => {
	for (const [component, expected] of [
		['Button', 'rcx-button'],
		['ButtonGroup', 'rcx-button-group'],
		['CheckBox', 'rcx-check-box'],
		['NavBar', 'rcx-navbar'],
		['ToastBar', 'rcx-toastbar'],
		['AutoComplete', 'rcx-autocomplete'],
	]) {
		assert.equal(rootClass(component), expected, component);
	}
});
