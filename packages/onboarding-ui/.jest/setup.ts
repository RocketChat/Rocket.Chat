import { TextEncoder } from 'node:util';

import i18next from 'i18next';
import { toHaveNoViolations } from 'jest-axe';
import { initReactI18next } from 'react-i18next';

import ResizeObserverMock from './ResizeObserverMock';
import en from '../.i18n/en.i18n.json';

beforeAll(async () => {
	return i18next.use(initReactI18next).init({
		fallbackLng: 'en',
		debug: false,
		resources: {
			en: {
				translation: en,
			},
		},
	});
});

beforeAll(() => {
	window.ResizeObserver = ResizeObserverMock;
});

Object.assign(globalThis, { TextEncoder });

expect.extend(toHaveNoViolations);
