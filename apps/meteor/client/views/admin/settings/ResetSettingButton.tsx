import type { Button } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

function ResetSettingButton(props: ComponentProps<typeof Button>): ReactElement {
	const t = useTranslation();

	return <IconButton icon='undo' danger small title={t('Reset')} {...props} />;
}

export default ResetSettingButton;
