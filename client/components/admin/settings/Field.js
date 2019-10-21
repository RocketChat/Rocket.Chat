import React from 'react';

import { Button } from '../../basic/Button';
import { Icon } from '../../basic/Icon';
import { MarkdownText } from '../../basic/MarkdownText';
import { RawText } from '../../basic/RawText';
import { useTranslation } from '../../providers/TranslationProvider';
import { useFieldActions } from './EditingState';


function GenericSettingInput({ _id, value, placeholder, readonly, autocomplete, disabled, onChange }) {
	const handleChange = (event) => {
		const { value } = event.currentTarget;
		onChange({ value });
	};

	return <input type='text' className='rc-input__element' name={_id} value={value} placeholder={placeholder}
		disabled={disabled} readOnly={readonly} autoComplete={autocomplete === false ? 'off' : undefined}
		onChange={handleChange} />;
}

function BooleanSettingInput({ _id, disabled, readonly, autocomplete, value, onChange }) {
	const t = useTranslation();

	const handleChange = (event) => {
		const value = event.currentTarget.value === '1';
		onChange({ value });
	};

	return <>
		<label>
			<input type='radio' name={_id} value='1' checked={value === true} disabled={disabled} readOnly={readonly}
				autoComplete={autocomplete === false ? 'off' : undefined} onChange={handleChange} /> {t('True')}
		</label>
		<label>
			<input type='radio' name={_id} value='0' checked={value === false} disabled={disabled} readOnly={readonly}
				autoComplete={autocomplete === false ? 'off' : undefined} onChange={handleChange} /> {t('False')}
		</label>
	</>;
}

export function Field({ field }) {
	const t = useTranslation();
	const { update, reset, disabled } = useFieldActions(field);

	const inputProps = { ...field, disabled, onChange: update };

	const {
		_id,
		disableReset,
		readonly,
		type,
		value,
		packageValue,
		blocked,
		changed,
		i18nLabel,
		i18nDescription,
		alert,
	} = field;

	const hasResetButton = !disableReset && !readonly && type !== 'asset' && value !== packageValue && !blocked;
	const onResetButtonClick = () => {
		reset();
	};

	return <div className={['input-line', 'double-col', changed && 'setting-changed'].filter(Boolean).join(' ')}>
		<label className='setting-label' title={_id}>{(i18nLabel && t(i18nLabel)) || (_id || t(_id))}</label>
		<div className='setting-field'>
			{(type === 'boolean' && <BooleanSettingInput {...inputProps} />)
				|| <GenericSettingInput {...inputProps} />}
			{/* {setting.type === 'string' && <StringSettingInput setting={setting} />} */}
			{/* {setting.type === 'relativeUrl' && <RelativeUrlSettingInput setting={setting} />} */}
			{/* {setting.type === 'password' && <PasswordSettingInput setting={setting} />} */}
			{/* {setting.type === 'int' && <IntSettingInput setting={setting} />} */}
			{/* {setting.type === 'select' && <SelectSettingInput setting={setting} />} */}
			{/* {setting.type === 'language' && <LanguageSettingInput setting={setting} />} */}
			{/* {setting.type === 'color' && <ColorSettingInput setting={setting} />} */}
			{/* {setting.type === 'font' && <FontSettingInput setting={setting} />} */}
			{/* {setting.type === 'code' && <CodeSettingInput setting={setting} />} */}
			{/* {setting.type === 'action' && <ActionSettingInput setting={setting} didSectionChange={didSectionChange} />} */}
			{/* {setting.type === 'asset' && <AssetSettingInput setting={setting} />} */}
			{/* {setting.type === 'roomPick' && <RoomPickSettingInput setting={setting} />} */}

			{t.has(i18nDescription) && <div className='settings-description secondary-font-color'>
				<MarkdownText>{t(i18nDescription)}</MarkdownText>
			</div>}

			{alert && <div className='settings-alert pending-color pending-background pending-border'>
				<Icon icon='icon-attention' />
				<RawText>{t(alert)}</RawText>
			</div>}
		</div>

		{hasResetButton && <Button
			aria-label={t('Reset')}
			children={<Icon icon='icon-ccw' className='color-error-contrast' />}
			className='reset-setting'
			data-setting={_id}
			cancel
			onClick={onResetButtonClick}
		/>}
	</div>;
}
