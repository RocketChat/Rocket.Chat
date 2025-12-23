import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import FeaturePreview from './FeaturePreview';
import FeaturePreviewOff from './FeaturePreviewOff';
import FeaturePreviewOn from './FeaturePreviewOn';

test('should renders off if the feature is disabled', async () => {
	render(
		<FeaturePreview feature='secondarySidebar'>
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
		<FeaturePreview feature='secondarySidebar'>
			<FeaturePreviewOn>on</FeaturePreviewOn>
			<FeaturePreviewOff>off</FeaturePreviewOff>
		</FeaturePreview>,
		{
			wrapper: mockAppRoot()
				.withSetting('Accounts_AllowFeaturePreview', true)
				.withUserPreference('featuresPreview', [{ name: 'secondarySidebar', value: true }])
				.build(),
		},
	);

	expect(screen.getByText('on')).toBeInTheDocument();
});
