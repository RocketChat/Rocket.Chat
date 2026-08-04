import type { ButtonProps } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type ResetSettingButtonProps = ButtonProps;

function ResetSettingButton(props: ResetSettingButtonProps) {
	const { t } = useTranslation();

	return <IconButton icon='undo' danger small title={t('Reset')} {...props} />;
}

export default ResetSettingButton;
