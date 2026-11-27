import type { ReactNode } from 'react';
import { View } from 'react-native';

import { composerTokens } from './tokens.ts';

const t = composerTokens('light');

// Web counterpart: packages/ui-composer/src/MessageComposer/MessageComposer.tsx (the bordered wrapper, rcx-input-box__wrapper)
export function ComposerContainer({ children }: { children: ReactNode }) {
	return (
		<View
			accessibilityRole='none'
			style={{
				marginTop: t.size.x2,
				overflow: 'hidden',
				borderWidth: t.borderWidth,
				borderColor: t.stroke.light,
				borderRadius: t.radius.medium,
				backgroundColor: t.surface.light,
			}}
		>
			{children}
		</View>
	);
}
