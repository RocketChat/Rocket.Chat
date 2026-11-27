import type { ReactNode } from 'react';

import MessageComposer from '../../../../packages/ui-composer/dist/MessageComposer/MessageComposer.js';

// The web wrapper's border, radius and background come from the rcx-input-box__wrapper stylesheet, which has no native counterpart:
// the same tokens are passed as Box props, which MessageComposer spreads on its Box
const chrome = { borderWidth: 'default', borderColor: 'light', borderRadius: 'medium', backgroundColor: 'light' };

export function ComposerContainer({ children }: { children: ReactNode }) {
	return <MessageComposer {...chrome}>{children}</MessageComposer>;
}
