import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

function ResetSettingButton(props: Omit<ComponentProps<typeof IconButton>, 'icon'>) {
	const { t } = useTranslation();

	return <IconButton icon='undo' variant='danger' size='small' title={t('Reset')} {...props} />;
}

export default ResetSettingButton;
