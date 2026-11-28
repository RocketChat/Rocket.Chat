import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { UiKitMessage, UiKitModal } from '../surfaces';

const block: UiKit.ImageBlock = { type: 'image', imageUrl: 'https://example.com/chart.png', altText: 'Weekly chart' };

const loadImage = ({
	complete,
	naturalWidth = 0,
	naturalHeight = 0,
}: {
	complete: boolean;
	naturalWidth?: number;
	naturalHeight?: number;
}) => {
	jest.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(complete);
	jest.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(naturalWidth);
	jest.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(naturalHeight);
};

const renderImage = (surface: typeof UiKitModal | typeof UiKitMessage) => render(surface([block]));

it('shows no image until it loads', () => {
	loadImage({ complete: false });

	renderImage(UiKitModal);

	expect(screen.queryByLabelText('Weekly chart')).not.toBeInTheDocument();
});

it('scales a large image down to 360 pixels on its longest side', () => {
	loadImage({ complete: true, naturalWidth: 1080, naturalHeight: 720 });

	renderImage(UiKitModal);

	expect(screen.getByLabelText('Weekly chart')).toHaveStyle({ width: '360px', height: '240px' });
});

it('lets a landscape image fill the width of a message', () => {
	loadImage({ complete: true, naturalWidth: 1080, naturalHeight: 720 });

	renderImage(UiKitMessage);

	expect(screen.getByLabelText('Weekly chart')).toHaveStyle({ width: '100%', maxWidth: '1080px' });
});

it('keeps a portrait image at its scaled size in a message', () => {
	loadImage({ complete: true, naturalWidth: 720, naturalHeight: 1080 });

	renderImage(UiKitMessage);

	expect(screen.getByLabelText('Weekly chart')).toHaveStyle({ width: '240px', height: '360px' });
});
