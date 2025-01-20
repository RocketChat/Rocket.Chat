import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useUserCustomFields } from './useUserCustomFields';

it('should not break with invalid Accounts_CustomFieldsToShowInUserInfo setting', async () => {
	const { result } = renderHook(
		() =>
			useUserCustomFields({
				prop: 'value',
			}),
		{
			legacyRoot: true,
			wrapper: mockAppRoot()
				.withSetting('Accounts_CustomFieldsToShowInUserInfo', '{"Invalid": "Object", "InvalidProperty": "Invalid" }')
				.build(),
		},
	);

	await waitFor(() => !!result.current);

	expect(result.current).toEqual(undefined);
});
