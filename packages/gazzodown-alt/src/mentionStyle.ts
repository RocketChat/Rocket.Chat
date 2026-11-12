import type { CSSProperties } from 'react';

export type MentionVariant = 'relevant' | 'other' | 'link';

const color: Record<MentionVariant, string> = {
	relevant: 'var(--rcx-message-highlight-colors-relevant-color, var(--rcx-color-status-font-on-service-1, #974809))',
	other: 'var(--rcx-message-highlight-colors-other-color, var(--rcx-color-status-font-on-warning, #895f00))',
	link: 'var(--rcx-message-highlight-colors-link-color, var(--rcx-color-status-font-on-info, #095ad2))',
};

export const mentionClassName = (variant: MentionVariant): string => `rcx-composer-mention rcx-composer-mention--${variant}`;

export const mentionStyle = (variant: MentionVariant): CSSProperties => ({
	color: color[variant],
	fontWeight: 500,
	whiteSpace: 'nowrap',
});
