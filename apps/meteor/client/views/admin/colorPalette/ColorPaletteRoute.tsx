import { useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Page from '../../../components/Page';
import ColorPalette from './ColorPalette';

const ColorPaletteRoute = (): ReactElement => {
	const route = useRoute('color-palette');

	return (
		<Page>
			<Page.Content>
				<ColorPalette />
			</Page.Content>
		</Page>
	);
};

export default ColorPaletteRoute;
