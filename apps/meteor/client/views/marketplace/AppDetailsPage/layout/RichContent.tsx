import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type RichContentProps = Pick<ComponentProps<typeof Box>, 'children' | 'dangerouslySetInnerHTML'>;

/**
 * Formatted text an app provides, such as its description, sample requests or log entries, set in the rich text styles.
 */
const RichContent = (props: RichContentProps) => <Box withRichContent {...props} />;

export default RichContent;
