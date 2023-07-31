import { MockedSettingsContext } from '@rocket.chat/mock-providers/src/MockedSettingsContext';
import { MockedUserContext } from '@rocket.chat/mock-providers/src/MockedUserContext';
import { render, screen } from '@testing-library/react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from './FeaturePreview';
import '@testing-library/jest-dom';

test('should renders off if the feature is disabled', async () => {
	render(
		<FeaturePreview feature='quickReactions'>
			<FeaturePreviewOn>on</FeaturePreviewOn>
			<FeaturePreviewOff>off</FeaturePreviewOff>
		</FeaturePreview>,
		{
			wrapper: ({ children }) => (
				<MockedSettingsContext
					settings={{
						Accounts_AllowFeaturePreview: true,
					}}
				>
					<MockedUserContext
						userPreferences={{
							featuresPreview: [],
						}}
					>
						{children}
					</MockedUserContext>
				</MockedSettingsContext>
			),
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
			wrapper: ({ children }) => (
				<MockedSettingsContext
					settings={{
						Accounts_AllowFeaturePreview: true,
					}}
				>
					<MockedUserContext
						userPreferences={{
							featuresPreview: [{ name: 'quickReactions', value: true }],
						}}
					>
						{children}
					</MockedUserContext>
				</MockedSettingsContext>
			),
		},
	);

	expect(screen.getByText('on')).toBeInTheDocument();
});
