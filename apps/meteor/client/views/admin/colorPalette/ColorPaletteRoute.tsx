import React, { ReactElement } from 'react';

import Page from '../../../components/Page';
import ColorPalette from './ColorPalette';

const ColorPaletteRoute = (): ReactElement => (
	<Page>
		<Page.Header title='Main UI colors' />

		<Page.ScrollableContentWithShadow>
			<ColorPalette />
		</Page.ScrollableContentWithShadow>
	</Page>
);

export default ColorPaletteRoute;
