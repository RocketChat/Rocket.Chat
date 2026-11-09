import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type RichContentProps = Pick<ComponentProps<typeof Box>, 'children' | 'dangerouslySetInnerHTML'>;

/**
 * A block of formatted text, its headings, paragraphs, lists, links and code set in the rich text styles.
 */
const RichContent = (props: RichContentProps) => <Box withRichContent {...props} />;

export default RichContent;
