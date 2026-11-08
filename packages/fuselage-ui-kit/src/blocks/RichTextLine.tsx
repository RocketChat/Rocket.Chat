import { Box, Tag } from '@rocket.chat/fuselage';
import type { TagProps } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactNode } from 'react';

import type { RichTextPart } from '../utils/richText/richTextRuns';

// Fuselage has no green, orange or brown tag; those take the closest tone.
const tagVariants: Record<UiKit.RichTextTagColor, NonNullable<TagProps['variant']>> = {
	gray: 'secondary',
	brown: 'secondary-warning',
	purple: 'featured',
	indigo: 'primary',
	blue: 'secondary-info',
	green: 'secondary',
	yellow: 'warning',
	orange: 'secondary-warning',
	red: 'danger',
};

const styledText = (text: string, style: UiKit.RichTextStyle | undefined): ReactNode => {
	let node: ReactNode = text;
	if (style?.code) node = <code>{node}</code>;
	if (style?.strike) node = <s>{node}</s>;
	if (style?.italic) node = <em>{node}</em>;
	if (style?.bold) node = <strong>{node}</strong>;
	return node;
};

// Relative and protocol-relative urls open on a host too, so they resolve against the page before it is read.
const hostOf = (url: string): string | undefined => {
	try {
		return new URL(url, window.location.href).host || undefined;
	} catch {
		return undefined;
	}
};

const singleLine = (text: string) => text.replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, '');

// The host comes first so a sender-chosen text cannot push it out of view or pass for another site.
const citationTitle = ({ text, url }: UiKit.RichTextCitationElement) => {
	const host = hostOf(url);
	return host ? `${host} \u2014 ${singleLine(text)}` : singleLine(text);
};

type RichTextLineProps = {
	parts: RichTextPart[];
};

/** One line of a rich text section, quote or list item: text runs and chips side by side. */
const RichTextLine = ({ parts }: RichTextLineProps) => (
	<Box display='flex' flexWrap='wrap' alignItems='center' columnGap='x4'>
		{parts.map((part, index) => {
			if (part.kind === 'markup') return <Markup key={index} tokens={part.tokens} />;

			const { element } = part;
			if (element.type === 'tag') {
				return (
					<Tag key={index} variant={tagVariants[element.color ?? 'gray']}>
						{styledText(element.text, element.style)}
					</Tag>
				);
			}

			return (
				<Box
					key={index}
					is='a'
					href={element.url}
					title={citationTitle(element)}
					aria-label={`[${element.index}] ${singleLine(element.text)}`}
					target='_blank'
					rel='noopener noreferrer'
				>
					[{element.index}]
				</Box>
			);
		})}
	</Box>
);

export default RichTextLine;
