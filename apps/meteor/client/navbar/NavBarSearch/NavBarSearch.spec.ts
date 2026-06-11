import { getAISearchButtonTooltip } from './getAISearchButtonTooltip';

describe('getAISearchButtonTooltip', () => {
	const t = (key: string): string => key;

	it('explains missing license without opening an upsell flow', () => {
		expect(getAISearchButtonTooltip({ hasIntelligentSearchLicense: false, intelligentSearchEnabled: true, t })).toBe(
			'AI_Search_license_required_tooltip',
		);
	});

	it('explains disabled AI Search when the add-on is available', () => {
		expect(getAISearchButtonTooltip({ hasIntelligentSearchLicense: true, intelligentSearchEnabled: false, t })).toBe(
			'AI_Search_disabled_tooltip',
		);
	});

	it('uses the normal action label when AI Search can be toggled', () => {
		expect(getAISearchButtonTooltip({ hasIntelligentSearchLicense: true, intelligentSearchEnabled: true, t })).toBe('Search_with_AI');
	});
});
