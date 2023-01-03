import { appStatusSpanProps } from '../helpers';
import type { App } from '../types';

export const filterAppsByDisabled = (app: App): boolean =>
	appStatusSpanProps(app)?.label === 'Disabled' ||
	appStatusSpanProps(app)?.label === 'Config Needed' ||
	appStatusSpanProps(app)?.label === 'Failed';
