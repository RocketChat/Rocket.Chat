import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AbacAttributeSectionProps = {
	'aria-label': string;
	'children': ReactNode;
};

/**
 * One of the room's attributes: its name above its values, as a section named after the attribute.
 */
const AbacAttributeSection = (props: AbacAttributeSectionProps) => (
	<Box is='section' display='flex' flexDirection='column' gap='x8' {...props} />
);

export default AbacAttributeSection;
