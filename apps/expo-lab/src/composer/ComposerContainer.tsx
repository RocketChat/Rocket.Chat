import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

// Web counterpart: packages/ui-composer/src/MessageComposer/MessageComposer.tsx. The input-box wrapper's chrome, drawn from the
// same tokens the InputBox native twin uses (borderWidth, borderColor, borderRadius, backgroundColor), plus the composer's overrides
export function ComposerContainer({ children }: { children: ReactNode }) {
	return (
		<Box
			rcx-input-box__wrapper
			marginBlockStart={2}
			display='flex'
			flexDirection='column'
			overflow='hidden'
			padding={0}
			borderWidth='default'
			borderColor='light'
			borderRadius='medium'
			backgroundColor='light'
		>
			{children}
		</Box>
	);
}
