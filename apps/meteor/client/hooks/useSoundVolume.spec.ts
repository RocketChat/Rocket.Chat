import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useSoundVolume } from './useSoundVolume';

it('should default to full volume when the user has no volume preferences', () => {
	const { result } = renderHook(() => useSoundVolume('voipRingerVolume'), {
		wrapper: mockAppRoot().build(),
	});
	expect(result.current).toBe(100);
});

it('should scale the requested volume by the master volume', () => {
	const { result } = renderHook(() => useSoundVolume('notificationsSoundVolume'), {
		wrapper: mockAppRoot().withUserPreference('masterVolume', 50).withUserPreference('notificationsSoundVolume', 80).build(),
	});
	expect(result.current).toBe(40);
});

it('should ignore the volume of other kinds of sound', () => {
	const { result } = renderHook(() => useSoundVolume('voipRingerVolume'), {
		wrapper: mockAppRoot().withUserPreference('notificationsSoundVolume', 10).withUserPreference('voipRingerVolume', 60).build(),
	});
	expect(result.current).toBe(60);
});
