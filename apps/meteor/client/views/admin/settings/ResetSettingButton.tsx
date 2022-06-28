import { Button, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, ReactElement } from 'react';

function ResetSettingButton(props: ComponentProps<typeof Button>): ReactElement {
	const t = useTranslation();

	return <IconButton icon='undo' type='button' aria-label={t('Reset')} danger small title={t('Reset')} style={{ padding: 0 }} {...props} />;
}

export default ResetSettingButton;
