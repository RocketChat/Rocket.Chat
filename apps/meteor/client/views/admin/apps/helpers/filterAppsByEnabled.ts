import { App } from '../types';
import { appStatusSpanProps } from './appStatusSpanProps';

export const filterAppsByEnabled = (app: App): boolean =>
	appStatusSpanProps(app)?.label === 'Installed' || appStatusSpanProps(app)?.label === 'Trial period';
