import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useComposerCapabilities } from './ComposerCapabilitiesContext';
import ComposerCapabilitiesProvider from './ComposerCapabilitiesProvider';

const renderCapabilities = (builder: ReturnType<typeof mockAppRoot>) => {
	const AppRoot = builder.build();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<ComposerCapabilitiesProvider rid='rid'>{children}</ComposerCapabilitiesProvider>
		</AppRoot>
	);
	return renderHook(() => useComposerCapabilities(), { wrapper }).result.current;
};

describe('ComposerCapabilitiesProvider', () => {
	it.each([
		['normal', true],
		['desktop', true],
		['alternative', false],
	])('sends on Enter for the %s preference on desktop: %s', (preference, expected) => {
		expect(renderCapabilities(mockAppRoot().withUserPreference('sendOnEnter', preference)).sendOnEnter).toBe(expected);
	});

	it('offers discussions only with the permission for the room', () => {
		expect(renderCapabilities(mockAppRoot()).canStartDiscussion).toBe(false);
		expect(renderCapabilities(mockAppRoot().withPermission('start-discussion')).canStartDiscussion).toBe(true);
	});
});
