import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';

import { composerTokens } from './tokens.ts';

const t = composerTokens('light');

// Web counterpart: packages/ui-composer/src/MessageComposer/MessageComposerToolbar.tsx (surface-neutral, padding 4, space-between)
export function ComposerToolbar({ children }: { children: ReactNode }) {
	return (
		<View
			style={{
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignItems: 'center',
				padding: t.space.x4,
				backgroundColor: t.surface.neutral,
			}}
		>
			{children}
		</View>
	);
}

// Web counterpart: MessageComposerToolbarActions.tsx. The slot for emoji, formatting and attach actions of later steps
export function ComposerToolbarActions({ children }: { children?: ReactNode }) {
	return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{children}</View>;
}

// Web counterpart: MessageComposerToolbarSubmit.tsx
export function ComposerToolbarSubmit({ children }: { children: ReactNode }) {
	return <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.x4 }}>{children}</View>;
}

// Natively the frame calls onClick without an event
type ActionProps = Pick<ComponentProps<typeof IconButton>, 'icon' | 'disabled' | 'variant' | 'aria-label'> & { onClick?: () => void };

// Web counterpart: MessageComposerAction.tsx (an IconButton, size small)
export function ComposerAction({ icon, disabled, variant, onClick, 'aria-label': ariaLabel }: ActionProps) {
	// IconButton hands aria-label to a web element that React Native never renders (probe: no accessibilityLabel on the host view),
	// so the label, role and state live on a wrapper until the frame maps them
	return (
		<View accessible accessibilityRole='button' accessibilityLabel={ariaLabel} accessibilityState={{ disabled }} onAccessibilityTap={onClick}>
			<IconButton size='small' icon={icon} disabled={disabled} variant={variant} onClick={onClick} />
		</View>
	);
}
