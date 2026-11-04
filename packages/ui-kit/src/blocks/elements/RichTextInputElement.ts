import type { Actionable } from '../Actionable';
import type { RichTextBlock } from '../layout/RichTextBlock';
import type { PlainText } from '../text/PlainText';

/** A multi-line field where the user types Markdown; its value is a `rich_text` block. */
export type RichTextInputElement = Actionable<{
	type: 'rich_text_input';
	placeholder?: PlainText;
	initial_value?: RichTextBlock;
	focus_on_load?: boolean;
}>;
