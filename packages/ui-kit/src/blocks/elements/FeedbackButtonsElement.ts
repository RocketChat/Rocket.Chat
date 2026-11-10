import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type FeedbackButton = {
	/** Names the button for screen readers and shows on hover. */
	text: PlainText;
	/** Sent in the block action when the button is clicked. */
	value: string;
	/** Replaces `text` for screen readers. */
	accessibility_label?: string;
};

/** A thumbs up and a thumbs down button, to rate the message they close. */
export type FeedbackButtonsElement = Actionable<{
	type: 'feedback_buttons';
	positive_button: FeedbackButton;
	negative_button: FeedbackButton;
}>;
