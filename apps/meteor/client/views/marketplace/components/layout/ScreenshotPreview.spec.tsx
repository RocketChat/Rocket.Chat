import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ScreenshotPreview from './ScreenshotPreview';

test.each(['{Enter}', ' '])('the preview is a button that opens on %s', async (key) => {
	const onClick = jest.fn();
	render(
		<ScreenshotPreview src='screenshot.png' alt='App preview image' onClick={onClick}>
			1 of 3
		</ScreenshotPreview>,
	);

	const preview = screen.getByRole('button', { name: /App preview image/ });
	preview.focus();
	await userEvent.keyboard(key);

	expect(onClick).toHaveBeenCalledTimes(1);
});
