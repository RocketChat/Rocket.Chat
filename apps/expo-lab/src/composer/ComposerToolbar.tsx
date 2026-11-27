import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';

import MessageComposerAction from '../../../../packages/ui-composer/dist/MessageComposer/MessageComposerAction.js';
import MessageComposerToolbar from '../../../../packages/ui-composer/dist/MessageComposer/MessageComposerToolbar.js';
import MessageComposerToolbarSubmit from '../../../../packages/ui-composer/dist/MessageComposer/MessageComposerToolbarSubmit.js';

// display='flex' is a row on the web but a column natively, which has no flexDirection default for Box
export function ComposerToolbar({ children }: { children: ReactNode }) {
	return (
		<MessageComposerToolbar flexDirection='row' alignItems='center'>
			{children}
		</MessageComposerToolbar>
	);
}

export const ComposerToolbarSubmit = MessageComposerToolbarSubmit;

// MessageComposerToolbarActions is not used: its @react-aria/toolbar hook throws "undefined is not a function" on Hermes (in
// @react-aria/i18n useDefaultLocale), so this stays the plain row it renders
export function ComposerToolbarActions({ children }: { children?: ReactNode }) {
	return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{children}</View>;
}

// Natively the frame calls onClick without an event
type ActionProps = Pick<ComponentProps<typeof MessageComposerAction>, 'icon' | 'disabled' | 'variant' | 'aria-label'> & { onClick?: () => void };

export function ComposerAction({ icon, disabled, variant, onClick, 'aria-label': ariaLabel }: ActionProps) {
	// IconButton hands aria-label to a web element that React Native never renders (probe: no accessibilityLabel on the host view),
	// so the label, role and state live on a wrapper until the frame maps them
	return (
		<View accessible accessibilityRole='button' accessibilityLabel={ariaLabel} accessibilityState={{ disabled }} onAccessibilityTap={onClick}>
			<MessageComposerAction icon={icon} disabled={disabled} variant={variant} onClick={onClick} />
		</View>
	);
}
