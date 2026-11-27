import { Box, OptionContent, OptionDescription } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ContactOptionContentProps = {
	label: ReactNode;
	description?: string;
};

/**
 * A contact option's name, followed by its phone numbers, which truncate first.
 */
const ContactOptionContent = ({ label, description }: ContactOptionContentProps) => (
	<>
		<Box is={OptionContent} marginInlineEnd='auto' flexGrow={0} flexShrink={0} flexBasis={0}>
			{label}
		</Box>
		{description ? (
			<Box withTruncatedText flexGrow={0} flexShrink={1} title={description}>
				<OptionDescription>{`(${description})`}</OptionDescription>
			</Box>
		) : null}
	</>
);

export default ContactOptionContent;
