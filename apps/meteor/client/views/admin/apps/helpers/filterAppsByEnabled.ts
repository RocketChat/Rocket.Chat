import { appStatusSpanProps } from '../helpers';
import { App } from '../types';

export const filterAppsByEnabled = (app: App): boolean =>
	appStatusSpanProps(app)?.label === 'Installed' || appStatusSpanProps(app)?.label === 'Trial period';
