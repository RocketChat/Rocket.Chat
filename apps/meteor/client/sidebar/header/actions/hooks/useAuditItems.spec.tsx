// import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-hooks';

import { useAuditItems } from './useAuditItems';

it('should not have license return an empty array', () => {
	const { result } = renderHook(() => useAuditItems());

	console.log(result);
});

// it('should return an empty array if don`t have permission can-audit && can-audit-log', () => {});
