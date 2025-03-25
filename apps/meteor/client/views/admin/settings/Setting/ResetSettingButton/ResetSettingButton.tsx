import type { Button } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

function ResetSettingButton(props: ComponentProps<typeof Button>): ReactElement {
	const { t } = useTranslation();

	return <IconButton icon='undo' danger small title={t('Reset')} {...props} />;
}

export default ResetSettingButton;
