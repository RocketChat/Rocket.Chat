import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { FormProvider, useForm } from 'react-hook-form';

import Page from '../../../components/Page';
import ColorPalette from './ColorPalette';
import { defaultValues } from './palette';

const ColorPaletteRoute = (): ReactElement => {
	const t = useTranslation();
	const methods = useForm({
		defaultValues,
	});

	return (
		<FormProvider {...methods}>
			{createPortal(
				<style>
					{`:root {\n${Object.entries(methods.getValues())
						.filter(([key, value]) => value !== defaultValues[key])
						.map(([name, color]) => `--rcx-${name}: ${color};`)
						.join('\n')}\n}`}
				</style>,
				document.head,
			)}
			<Page>
				<Page.Header title='Main UI colors'>
					<ButtonGroup>
						<Button form='palette' type='submit' primary flexGrow={1} disabled={!methods.formState.isDirty}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Page.Header>

				<Page.ScrollableContentWithShadow>
					<ColorPalette />
				</Page.ScrollableContentWithShadow>
			</Page>
		</FormProvider>
	);
};

export default ColorPaletteRoute;
