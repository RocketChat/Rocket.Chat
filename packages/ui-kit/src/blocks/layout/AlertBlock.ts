import type { LayoutBlockish } from '../LayoutBlockish';
import type { TextObject } from '../TextObject';

/** A short notice about something the reader should know, styled by its level. */
export type AlertBlock = LayoutBlockish<{
	type: 'alert';
	/** At most 200 characters. */
	text: TextObject;
	/** Defaults to `default`. */
	level?: 'default' | 'info' | 'warning' | 'error' | 'success';
}>;
