import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import { useTranslation } from '../../providers/TranslationProvider';
import { Icon } from '../../basic/Icon';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { Button } from '../../basic/Button';
import { handleError } from '../../../../app/utils/client';

export function SelectSettingInput({
	_id,
	value,
	readonly,
	values,
	disabled,
	onChange,
}) {
	const t = useTranslation();

	const handleChange = (event) => {
		const { value } = event.currentTarget;
		onChange({ value });
	};

	return <div className='rc-select'>
		<select className='rc-select__element' name={_id} value={value} disabled={disabled} readOnly={readonly} onChange={handleChange}>
			{values.map(({ key, i18nLabel }) =>
				<option key={key} value={key}>{t(i18nLabel)}</option>
			)}
		</select>
		<Icon block='rc-select__arrow' icon='arrow-down' />
	</div>;
}

export function LanguageSettingInput({
	_id,
	value,
	readonly,
	disabled,
	onChange,
}) {
	const languages = useReactiveValue(() => {
		const languages = TAPi18n.getLanguages();

		const result = Object.entries(languages)
			.map(([key, language]) => ({ ...language, key: key.toLowerCase() }))
			.sort((a, b) => a.key - b.key);

		result.unshift({
			name: 'Default',
			en: 'Default',
			key: '',
		});

		return result;
	}, []);

	const handleChange = (event) => {
		const { value } = event.currentTarget;
		onChange({ value });
	};

	return <div className='rc-select'>
		<select className='rc-select__element' name={_id} disabled={disabled} readOnly={readonly} value={value} onChange={handleChange}>
			{languages.map(({ key, name }) =>
				<option key={key} value={key} dir='auto'>{name}</option>
			)}
		</select>
		<Icon block='rc-select__arrow' icon='arrow-down' />
	</div>;
}

export function ColorSettingInput({
	_id,
	value,
	editor,
	allowedTypes,
	autocomplete,
	disabled,
	onChange,
}) {
	const t = useTranslation();

	const handleChange = (event) => {
		const { value } = event.currentTarget;
		onChange({ value });
	};

	const handleEditorTypeChange = (event) => {
		const editor = event.currentTarget.value.trim();
		onChange({ editor });
	};

	return <>
		<div className='horizontal'>
			{editor === 'color' && <div className='flex-grow-1'>
				<input className='rc-input__element colorpicker-input' type='text' name={_id} value={value} autoComplete='off' disabled={disabled} onChange={handleChange} />
				<span className='colorpicker-swatch border-component-color' style={{ backgroundColor: value }} />
			</div>}
			{editor === 'expression' && <div className='flex-grow-1'>
				<input className='rc-input__element' type='text' name={_id} value={value} disabled={disabled} autoComplete={autocomplete === false ? 'off' : undefined} onChange={handleChange} />
			</div>}
			<div className='color-editor'>
				<select name='color-editor' value={editor} onChange={handleEditorTypeChange}>
					{allowedTypes && allowedTypes.map((allowedType) =>
						<option key={allowedType} value={allowedType}>{t(allowedType)}</option>)}
				</select>
			</div>
		</div>
		<div className='settings-description'>Variable name: {_id.replace(/theme-color-/, '@')}</div>
	</>;
}

export function FontSettingInput({
	_id,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	onChange,
}) {
	const handleChange = (event) => {
		const { value } = event.currentTarget;
		onChange({ value });
	};

	return <input type='text' className='rc-input__element' name={_id} value={value} placeholder={placeholder} disabled={disabled} readOnly={readonly} autoComplete={autocomplete === false ? 'off' : undefined} onChange={handleChange} />;
}

export function CodeSettingInput({
	_id,
	i18nLabel,
	disabled,
}) {
	const t = useTranslation();

	return disabled
		? <>{/* {> CodeMirror name=_id options=(getEditorOptions true) code=(i18nDefaultValue) }*/}</>
		: <div className='code-mirror-box' data-editor-id={_id}>
			<div className='title'>{(i18nLabel && t(i18nLabel)) || (_id || t(_id))}</div>
			{/* {> CodeMirror name=_id options=getEditorOptions code=value editorOnBlur=setEditorOnBlur}*/}

			<div className='buttons'>
				<Button primary className='button-fullscreen'>{t('Full_Screen')}</Button>
				<Button primary className='button-restore'>{t('Exit_Full_Screen')}</Button>
			</div>
		</div>;
}

export function ActionSettingInput({
	value,
	actionText,
	disabled,
	didSectionChange,
}) {
	const t = useTranslation();

	const handleClick = async () => {
		Meteor.call(value, (err, data) => {
			if (err) {
				err.details = Object.assign(err.details || {}, {
					errorTitle: 'Error',
				});
				handleError(err);
				return;
			}

			const args = [data.message].concat(data.params);
			toastr.success(TAPi18n.__.apply(TAPi18n, args), TAPi18n.__('Success'));
		});
	};

	return didSectionChange
		? <span style={{ lineHeight: '40px' }} className='secondary-font-color'>{t('Save_to_enable_this_action')}</span>
		: <Button primary disabled={disabled} onClick={handleClick}>{t(actionText)}</Button>;
}

export function AssetSettingInput({
	value,
	fileConstraints,
}) {
	const t = useTranslation();
	return value.url
		? <div className='settings-file-preview'>
			<div className='preview' style={{ backgroundImage: `url(${ value.url }?_dc=${ Random.id() })` }} />
			<div className='action'>
				<Button className='delete-asset'>
					<Icon icon='icon-trash' />{t('Delete')}
				</Button>
			</div>
		</div>
		: <div className='settings-file-preview'>
			<div className='preview no-file background-transparent-light secondary-font-color'><Icon icon='icon-upload' /></div>
			<div className='action'>
				<div className='rc-button rc-button--primary'>{t('Select_file')}
					<input type='file' accept={fileConstraints.extensions && fileConstraints.extensions.length && `.${ fileConstraints.extensions.join(', .') }`} />
				</div>
			</div>
		</div>;
}

export function RoomPickSettingInput({ _id }) {
	// const collection = usePrivateSettingsCollection();
	const [selectedRooms] = useState({});

	// useEffect(() => {
	// 	const withRoomPickType = (f) => (data) => {
	// 		if (data.type !== 'roomPick') {
	// 			return;
	// 		}

	// 		f(data);
	// 	};

	// 	collection.find().observe({
	// 		added: withRoomPickType((data) => {
	// 			setSelectedRooms({
	// 				...selectedRooms,
	// 				[data._id]: data.value,
	// 			});
	// 		}),
	// 		changed: withRoomPickType((data) => {
	// 			setSelectedRooms({
	// 				...selectedRooms,
	// 				[data._id]: data.value,
	// 			});
	// 		}),
	// 		removed: withRoomPickType((data) => {
	// 			setSelectedRooms(
	// 				Object.entries(selectedRooms)
	// 					.filter(([key]) => key !== data._id)
	// 					.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
	// 			);
	// 		}),
	// 	});
	// }, [collection]);

	return <div>
		{/* {{> inputAutocomplete settings=autocompleteRoom id=_id name=_id class="search autocomplete rc-input__element" autocomplete="off" disabled=isDisabled.disabled}} */}
		<ul class='selected-rooms'>
			{(selectedRooms[_id] || []).map(({ name }) =>
				<li key={name} className='remove-room' data-setting={_id}>
					{name} <Icon icon='icon-cancel' />
				</li>
			)}
		</ul>
	</div>;
}
