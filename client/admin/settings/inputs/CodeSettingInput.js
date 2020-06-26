import { Box, Button, Field, Flex } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useRef, useState } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { ResetSettingButton } from '../ResetSettingButton';

function CodeMirror({
	lineNumbers = true,
	lineWrapping = true,
	mode = 'javascript',
	gutters = ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
	foldGutter = true,
	matchBrackets = true,
	autoCloseBrackets = true,
	matchTags = true,
	showTrailingSpace = true,
	highlightSelectionMatches = true,
	readOnly,
	value: valueProp,
	defaultValue,
	onChange,
	...props
}) {
	const [editor, setEditor] = useState();
	const [value, setValue] = useState(valueProp || defaultValue);
	const ref = useRef();

	useEffect(() => {
		let editor;

		const setupCodeMirror = async () => {
			const CodeMirror = await import('codemirror/lib/codemirror.js');
			await import('../../../../app/ui/client/lib/codeMirror/codeMirror');
			await import('codemirror/lib/codemirror.css');

			const { current: textarea } = ref;

			if (!textarea) {
				return;
			}

			editor = CodeMirror.fromTextArea(textarea, {
				lineNumbers,
				lineWrapping,
				mode,
				gutters,
				foldGutter,
				matchBrackets,
				autoCloseBrackets,
				matchTags,
				showTrailingSpace,
				highlightSelectionMatches,
				readOnly,
			});

			editor.on('change', (doc) => {
				const value = doc.getValue();
				setValue(value);
				onChange(value);
			});

			setEditor(editor);
		};

		setupCodeMirror();

		return () => {
			if (!editor) {
				return;
			}

			editor.toTextArea();
		};
	}, [ref]);

	useEffect(() => {
		setValue(valueProp);
	}, [valueProp]);

	useEffect(() => {
		if (!editor) {
			return;
		}

		if (value !== editor.getValue()) {
			editor.setValue(value);
		}
	}, [editor, ref, value]);

	return <textarea readOnly ref={ref} style={{ display: 'none' }} value={value} {...props}/>;
}

export function CodeSettingInput({
	_id,
	label,
	value = '',
	code,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}) {
	const t = useTranslation();

	const [fullScreen, toggleFullScreen] = useToggle(false);

	const handleChange = (value) => {
		onChangeValue(value);
	};

	return <>
		<Flex.Container>
			<Box>
				<Field.Label htmlFor={_id} title={_id}>{label}</Field.Label>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</Box>
		</Flex.Container>
		<div
			className={[
				'code-mirror-box',
				fullScreen && 'code-mirror-box-fullscreen content-background-color',
			].filter(Boolean).join(' ')}
		>
			<div className='title'>{label}</div>
			<CodeMirror
				data-qa-setting-id={_id}
				id={_id}
				mode={code}
				value={value}
				placeholder={placeholder}
				disabled={disabled}
				readOnly={readonly}
				autoComplete={autocomplete === false ? 'off' : undefined}
				onChange={handleChange}
			/>
			<div className='buttons'>
				<Button primary onClick={() => toggleFullScreen()}>{fullScreen ? t('Exit_Full_Screen') : t('Full_Screen')}</Button>
			</div>
		</div>
	</>;
}
