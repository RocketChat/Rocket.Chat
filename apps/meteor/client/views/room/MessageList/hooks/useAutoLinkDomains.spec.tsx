import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useAutoLinkDomains } from './useAutoLinkDomains';

it('should return the domains of the Message_CustomDomain_AutoLink setting outside any message list', () => {
	const { result } = renderHook(() => useAutoLinkDomains(), {
		wrapper: mockAppRoot().withSetting('Message_CustomDomain_AutoLink', 'example.com, rocket.chat').build(),
	});

	expect(result.current).toEqual(['example.com', 'rocket.chat']);
});

it('should return no domains when the setting is empty', () => {
	const { result } = renderHook(() => useAutoLinkDomains(), {
		wrapper: mockAppRoot().withSetting('Message_CustomDomain_AutoLink', '').build(),
	});

	expect(result.current).toEqual([]);
});
