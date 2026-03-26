import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemePreviewProvider } from './ThemePreviewProvider';
import { useThemePreview } from '../hooks/useThemePreview';

const TestComponent = () => {
	const { previewTheme, setPreviewTheme, clearPreviewTheme } = useThemePreview();

	return (
		<div>
			<div data-testid='preview-theme'>{previewTheme || 'none'}</div>
			<button onClick={() => setPreviewTheme('dark')}>Set Dark</button>
			<button onClick={() => setPreviewTheme('light')}>Set Light</button>
			<button onClick={() => clearPreviewTheme()}>Clear Preview</button>
		</div>
	);
};

describe('ThemePreviewProvider', () => {
	it('should provide theme preview context to children', () => {
		render(
			<ThemePreviewProvider>
				<TestComponent />
			</ThemePreviewProvider>,
		);

		expect(screen.getByTestId('preview-theme')).toHaveTextContent('none');
	});

	it('should set preview theme when setPreviewTheme is called', async () => {
		render(
			<ThemePreviewProvider>
				<TestComponent />
			</ThemePreviewProvider>,
		);

		const setDarkButton = screen.getByText('Set Dark');

		await userEvent.click(setDarkButton);

		expect(screen.getByTestId('preview-theme')).toHaveTextContent('dark');
	});

	it('should clear preview theme when clearPreviewTheme is called', async () => {
		render(
			<ThemePreviewProvider>
				<TestComponent />
			</ThemePreviewProvider>,
		);

		const setLightButton = screen.getByText('Set Light');
		const clearButton = screen.getByText('Clear Preview');

		await userEvent.click(setLightButton);

		expect(screen.getByTestId('preview-theme')).toHaveTextContent('light');

		await userEvent.click(clearButton);

		expect(screen.getByTestId('preview-theme')).toHaveTextContent('none');
	});

	it('should allow switching between preview themes', async () => {
		render(
			<ThemePreviewProvider>
				<TestComponent />
			</ThemePreviewProvider>,
		);

		const setDarkButton = screen.getByText('Set Dark');
		const setLightButton = screen.getByText('Set Light');

		await userEvent.click(setDarkButton);

		expect(screen.getByTestId('preview-theme')).toHaveTextContent('dark');

		await userEvent.click(setLightButton);

		expect(screen.getByTestId('preview-theme')).toHaveTextContent('light');
	});

	it('should share state across multiple consumers', () => {
		const ConsumerA = () => {
			const { previewTheme, setPreviewTheme } = useThemePreview();
			return (
				<div>
					<div data-testid='consumer-a-theme'>{previewTheme || 'none'}</div>
					<button onClick={() => setPreviewTheme('dark')}>Set Dark (A)</button>
				</div>
			);
		};

		const ConsumerB = () => {
			const { previewTheme } = useThemePreview();
			return <div data-testid='consumer-b-theme'>{previewTheme || 'none'}</div>;
		};

		render(
			<ThemePreviewProvider>
				<ConsumerA />
				<ConsumerB />
			</ThemePreviewProvider>,
		);

		const setDarkButton = screen.getByText('Set Dark (A)');

		setDarkButton.click();

		expect(screen.getByTestId('consumer-a-theme')).toHaveTextContent('dark');
		expect(screen.getByTestId('consumer-b-theme')).toHaveTextContent('dark');
	});
});
