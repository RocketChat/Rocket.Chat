import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useBackgroundEffectChoices } from './useBackgroundEffectChoices';
import type { CallBackgroundBlur } from '../call/context';
import { CallMediaProcessingProvider } from '../call/context';
import { buildMediaProcessing } from '../fixtures/callFixtures';

const renderChoices = (overrides: Partial<CallBackgroundBlur>) => {
	const processing = buildMediaProcessing();
	const value = { ...processing, backgroundBlur: { ...processing.backgroundBlur, ...overrides } };
	const AppRoot = mockAppRoot().build();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<CallMediaProcessingProvider value={value}>{children}</CallMediaProcessingProvider>
		</AppRoot>
	);
	return renderHook(() => useBackgroundEffectChoices(), { wrapper }).result.current;
};

it('offers the levels and a background image to choose, with no model while nothing is blurred', () => {
	const sections = renderChoices({});

	expect(sections).toHaveLength(1);
	expect(sections[0].choices.map(({ id }) => id)).toEqual(['level-none', 'level-light', 'level-medium', 'level-strong', 'image-choose']);
	// Opening the file picker is an action, not an option that could be the one in use.
	expect(sections[0].choices.at(-1)?.selected).toBeUndefined();
});

it('offers the model while this device is doing the blurring', () => {
	expect(renderChoices({ level: 'medium' })).toHaveLength(2);
});

// The camera's own blur has no model to choose.
it('offers no model while the camera blurs', () => {
	expect(renderChoices({ level: 'medium', blur: 'camera' })).toHaveLength(1);
});
