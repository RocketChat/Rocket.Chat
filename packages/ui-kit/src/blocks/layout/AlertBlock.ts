import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { TextObject } from '../TextObject.js';

/** A short notice about something the reader should know, styled by its level. */
export type AlertBlock = LayoutBlockish<{
	type: 'alert';
	/** At most 200 characters. */
	text: TextObject;
	/** Defaults to `default`. */
	level?: 'default' | 'info' | 'warning' | 'error' | 'success';
}>;
