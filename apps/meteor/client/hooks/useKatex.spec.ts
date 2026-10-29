import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useKatex } from './useKatex';

it('should return enabled true dollar syntax true and parenthesis syntax true if all settings is enabled', () => {
	const { result } = renderHook(() => useKatex(), {
		wrapper: mockAppRoot()
			.withSetting('Katex_Enabled', true)
			.withSetting('Katex_Dollar_Syntax', true)
			.withSetting('Katex_Parenthesis_Syntax', true)
			.build(),
	});

	expect(result.current.katexEnabled).toBe(true);
	expect(result.current.katexDollarSyntaxEnabled).toBe(true);
	expect(result.current.katexParenthesisSyntaxEnabled).toBe(true);
});

it('should return enabled false dollar syntax false and parenthesis syntax false if all settings is disabled', () => {
	const { result } = renderHook(() => useKatex(), {
		wrapper: mockAppRoot()
			.withSetting('Katex_Enabled', false)
			.withSetting('Katex_Dollar_Syntax', false)
			.withSetting('Katex_Parenthesis_Syntax', false)
			.build(),
	});

	expect(result.current.katexEnabled).toBe(false);
	expect(result.current.katexDollarSyntaxEnabled).toBe(false);
	expect(result.current.katexParenthesisSyntaxEnabled).toBe(false);
});

it('should return enabled true dollar syntax false and parenthesis syntax false if Katex_Enabled settings is enable', () => {
	const { result } = renderHook(() => useKatex(), {
		wrapper: mockAppRoot()
			.withSetting('Katex_Enabled', true)
			.withSetting('Katex_Dollar_Syntax', false)
			.withSetting('Katex_Parenthesis_Syntax', false)
			.build(),
	});

	expect(result.current.katexEnabled).toBe(true);
	expect(result.current.katexDollarSyntaxEnabled).toBe(false);
	expect(result.current.katexParenthesisSyntaxEnabled).toBe(false);
});

it('should return enabled false dollar syntax false and parenthesis syntax false if DollarSyntaxEnabled and ParenthesisSyntaxEnabled settings is enable', () => {
	const { result } = renderHook(() => useKatex(), {
		wrapper: mockAppRoot()
			.withSetting('Katex_Enabled', false)
			.withSetting('Katex_Dollar_Syntax', true)
			.withSetting('Katex_Parenthesis_Syntax', true)
			.build(),
	});

	expect(result.current.katexEnabled).toBe(false);
	expect(result.current.katexDollarSyntaxEnabled).toBe(false);
	expect(result.current.katexParenthesisSyntaxEnabled).toBe(false);
});
