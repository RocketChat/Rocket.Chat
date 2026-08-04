import type { Button } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

export type ResetSettingButtonProps = ComponentProps<typeof Button>;

function ResetSettingButton(props: ResetSettingButtonProps) {
	const { t } = useTranslation();

	return <IconButton icon='undo' danger small title={t('Reset')} {...props} />;
}

export default ResetSettingButton;
