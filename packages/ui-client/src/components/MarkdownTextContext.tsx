import { Box } from '@rocket.chat/fuselage';
import type { ComponentType } from 'react';
import { createContext } from 'react';

export type MarkdownTextComponentProps = {
	content: string;
	variant?: 'inline' | 'inlineWithoutBreaks' | 'document';
	parseEmoji?: boolean;
	withTruncatedText?: boolean;
};

// Markdown parsing depends on app-level emoji and parser settings, so the app provides the real renderer; without it, content shows as plain text.
const PlainText = ({ content, withTruncatedText = false }: MarkdownTextComponentProps) => (
	<Box withTruncatedText={withTruncatedText}>{content}</Box>
);

// TODO: drop this context once MarkdownText's dependencies (emoji parsing, parser limits) move to ui-client or are reachable through existing contexts
export const MarkdownTextContext = createContext<ComponentType<MarkdownTextComponentProps>>(PlainText);
