import { Button, Field, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { SettingInputProps } from './types';

export type ActionInputBaseProps = SettingInputProps & {
	actionText: TranslationKey;
	sectionChanged: boolean;
	onAction: () => Promise<{ message: TranslationKey; params?: string[] }>;
};

function ActionInputBase({ _id, label, actionText, hint, disabled, sectionChanged, onAction }: ActionInputBaseProps) {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const labelId = useId();

	const handleClick = async (): Promise<void> => {
		try {
			const data = await onAction();
			const params = data.params || [];
			dispatchToastMessage({ type: 'success', message: t(data.message, { postProcess: 'sprintf', sprintf: params }) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<Field>
			<FieldRow>
				<FieldLabel id={labelId} title={_id}>
					{label}
				</FieldLabel>
			</FieldRow>
			<FieldRow>
				<Button aria-describedby={labelId} disabled={disabled || sectionChanged} primary onClick={handleClick}>
					{t(actionText)}
				</Button>
			</FieldRow>
			{sectionChanged && <FieldHint>{t('Save_to_enable_this_action')}</FieldHint>}
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default ActionInputBase;
