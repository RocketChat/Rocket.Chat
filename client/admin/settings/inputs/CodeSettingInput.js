import { Box, Button, Field, Flex } from '@rocket.chat/fuselage';
import { useToggle, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useRef, useState } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { ResetSettingButton } from '../ResetSettingButton';

const defaultGutters = ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'];

function CodeMirror({
	lineNumbers = true,
	lineWrapping = true,
	mode = 'javascript',
	gutters = defaultGutters,
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
	const [value, setValue] = useState(valueProp || defaultValue);

	const textAreaRef = useRef();
	const editorRef = useRef();
	const handleChange = useMutableCallback(onChange);

	useEffect(() => {
		if (editorRef.current) {
			return;
		}

		const setupCodeMirror = async () => {
			const CodeMirror = await import('codemirror/lib/codemirror.js');
			await import('../../../../app/ui/client/lib/codeMirror/codeMirror');
			await import('codemirror/lib/codemirror.css');

			if (!textAreaRef.current) {
				return;
			}

			editorRef.current = CodeMirror.fromTextArea(textAreaRef.current, {
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

			editorRef.current.on('change', (doc) => {
				const value = doc.getValue();
				setValue(value);
				handleChange(value);
			});
		};

		setupCodeMirror();

		return () => {
			if (!editorRef.current) {
				return;
			}

			editorRef.current.toTextArea();
		};
	}, [
		autoCloseBrackets,
		foldGutter,
		gutters,
		highlightSelectionMatches,
		lineNumbers,
		lineWrapping,
		matchBrackets,
		matchTags,
		mode,
		handleChange,
		readOnly,
		textAreaRef,
		showTrailingSpace,
	]);

	useEffect(() => {
		setValue(valueProp);
	}, [valueProp]);

	useEffect(() => {
		if (!editorRef.current) {
			return;
		}

		if (value !== editorRef.current.getValue()) {
			editorRef.current.setValue(value);
		}
	}, [textAreaRef, value]);

	return <textarea readOnly ref={textAreaRef} style={{ display: 'none' }} value={value} {...props} />;
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
