// eslint-disable-next-line spaced-comment
/// <reference types="vite/client" />
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { e2e } from '../client/lib/e2ee/rocketchat.e2e.ts';

import 'meteor/service-configuration';

import '../app/theme/client/main.css';

/**
 * Used in E2E tests
 */
const require = (text: string) => {
	switch (text) {
		case '/client/lib/e2ee/rocketchat.e2e.ts':
			return { e2e };
		case 'meteor/accounts-base':
			return { Accounts };
		default:
			throw new Error(`Module not found: ${text}`);
	}
};

Object.assign(globalThis, { require });
