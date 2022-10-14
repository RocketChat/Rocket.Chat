import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { PaletteStyleTag } from '@rocket.chat/ui-theming/src/PaletteStyleTag';
import { hasChanges } from '@rocket.chat/ui-theming/src/hasChanges';
import { useLayoutPalette } from '@rocket.chat/ui-theming/src/hooks/useLayoutVariables';
import { defaultPalette } from '@rocket.chat/ui-theming/src/palette';
import React, { ReactElement } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import Page from '../../../components/Page';
import ColorPalette from './ColorPalette';

const ColorPaletteRoute = (): ReactElement => {
	const t = useTranslation();

	const values = useLayoutPalette();

	const methods = useForm({
		defaultValues: { ...defaultPalette, ...values },
	});

	return (
		<FormProvider {...methods}>
			<PaletteStyleTag palette={methods.watch()} />
			<Page>
				<Page.Header title='Main UI colors'>
					<ButtonGroup>
						<Button
							form='palette'
							secondary
							disabled={!hasChanges(defaultPalette, methods.getValues())}
							onClick={() => {
								methods.reset({ ...defaultPalette });
							}}
						>
							{t('Reset')}
						</Button>
						<Button
							form='palette'
							onClick={() => {
								methods.reset();
							}}
							secondary
							disabled={!methods.formState.isDirty}
						>
							{t('Cancel')}
						</Button>
						<Button form='palette' type='submit' primary disabled={!methods.formState.isDirty}>
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
