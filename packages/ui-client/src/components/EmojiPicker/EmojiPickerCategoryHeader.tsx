import { ButtonGroup } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerCategoryHeader = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is' | 'wrap'>) => (
	<ButtonGroup {...props} small mbs='x12' mi='x12' stretch />
);

export default EmojiPickerCategoryHeader;
