import { appStatusSpanProps } from '../helpers';
import type { App } from '../types';

export const filterAppsByEnabled = (app: App): boolean =>
	appStatusSpanProps(app)?.label === 'Enabled' || appStatusSpanProps(app)?.label === 'Trial period';
