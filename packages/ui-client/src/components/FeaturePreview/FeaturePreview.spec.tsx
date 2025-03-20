import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from './FeaturePreview';

test('should renders off if the feature is disabled', async () => {
	render(
		<FeaturePreview feature='quickReactions'>
			<FeaturePreviewOn>on</FeaturePreviewOn>
			<FeaturePreviewOff>off</FeaturePreviewOff>
		</FeaturePreview>,
		{
			wrapper: mockAppRoot().withSetting('Accounts_AllowFeaturePreview', true).build(),
		},
	);

	expect(screen.getByText('off')).toBeInTheDocument();
});

test('should renders on if the feature is enabled', async () => {
	render(
		<FeaturePreview feature='quickReactions'>
			<FeaturePreviewOn>on</FeaturePreviewOn>
			<FeaturePreviewOff>off</FeaturePreviewOff>
		</FeaturePreview>,
		{
			wrapper: mockAppRoot()
				.withSetting('Accounts_AllowFeaturePreview', true)
				.withUserPreference('featuresPreview', [{ name: 'quickReactions', value: true }])
				.build(),
		},
	);

	expect(screen.getByText('on')).toBeInTheDocument();
});
