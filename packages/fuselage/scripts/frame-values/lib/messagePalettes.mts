import { themed } from './frameTokens.mts';
import { offScale } from './tokens.mts';
import { statusBackgroundColors, statusColors } from '../../../src/Theme.ts';
import { backgroundColor, borderRadius, borderWidth, fontColor, strokeColor } from '../../../src/styleTokens.ts';

const status = (name: keyof typeof statusColors) => statusColors[name].toString();

/** The colours and sizes of a Message and its parts, under the `--rcx-message-*` custom properties a theme can override. */
export const messagePalettes = () => ({
	editing: {
		background: themed('message-background-color-editing', statusBackgroundColors['status-background-warning-2'].toString()),
		color: themed('message-color-editing', status('status-font-on-warning-2')),
	},
	highlight: {
		critical: themed('message-highlight-colors-critical-color', status('status-font-on-danger')),
		relevant: themed('message-highlight-colors-relevant-color', status('status-font-on-service-1')),
		other: themed('message-highlight-colors-other-color', status('status-font-on-warning')),
		link: themed('message-highlight-colors-link-color', status('status-font-on-info')),
	},
	blockWidthFixed: themed('message-block-width-fixed', '368px'),
	divider: {
		background: themed('message-divider-background-color', strokeColor('extra-light')),
		color: themed('message-divider-color', fontColor('default')),
		colorUnread: themed('message-divider-color-unread', fontColor('danger')),
		backgroundUnread: themed('message-divider-background-color-unread', strokeColor('error')),
		size: themed('message-divider-size', borderWidth('default')),
		sizeNeg: themed('message-divider-size-neg', offScale(-1)),
	},
	toolbarBorderRadius: themed('message-toolbar-border-radius', borderRadius('medium')),
	reaction: {
		borderRadius: themed('message-reaction-border-radius', borderRadius('medium')),
		hoverBorder: themed('message-reaction-hover-border-color', strokeColor('dark')),
		hoverBackground: themed('message-reaction-hover-background-color', backgroundColor('hover')),
		color: themed('message-reaction-color', fontColor('default')),
		border: themed('message-reaction-border-color', strokeColor('dark')),
		background: themed('message-reaction-background-color', backgroundColor('selected')),
	},
	genericPreview: {
		border: themed('message-generic-preview-border-color', strokeColor('extra-light')),
		title: themed('message-generic-preview-title-color', fontColor('default')),
		context: themed('message-generic-preview-context-color', fontColor('secondary-info')),
		description: themed('message-generic-preview-description-color', fontColor('default')),
		contentBackground: themed('message-generic-preview-content-background-color', backgroundColor('tint')),
		iconBackground: themed('message-generic-preview-icon-background-color', backgroundColor('neutral')),
	},
});
