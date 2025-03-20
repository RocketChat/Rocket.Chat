import { css } from '@rocket.chat/css-in-js';
import { Box, Divider } from '@rocket.chat/fuselage';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

type InsertPlaceholderDropdownProps = {
	onChange: any;
	textAreaRef: RefObject<HTMLTextAreaElement>;
	setVisible: Dispatch<SetStateAction<boolean>>;
};

const InsertPlaceholderDropdown = ({ onChange, textAreaRef, setVisible }: InsertPlaceholderDropdownProps) => {
	const { t } = useTranslation();

	const clickable = css`
		cursor: pointer;
	`;

	const setPlaceholder = (name: any): void => {
		if (textAreaRef?.current) {
			const text = textAreaRef.current.value;
			const startPos = textAreaRef.current.selectionStart;
			const placeholder = `{{${name}}}`;

			textAreaRef.current.value = text.slice(0, startPos) + placeholder + text.slice(startPos);

			textAreaRef.current.focus();
			textAreaRef.current.setSelectionRange(startPos + placeholder.length, startPos + placeholder.length);

			setVisible(false);
			onChange(textAreaRef.current.value);
		}
	};

	return (
		<Box>
			<Box textTransform='uppercase' fontScale='c1' fontSize='10px'>
				{t('Contact')}
			</Box>
			<Box is='ul'>
				<Box className={clickable} is='li' onClick={(): void => setPlaceholder('contact.name')}>
					<Box mb='4px' style={{ width: '100%' }} fontScale='p2'>
						{t('Name')}
					</Box>
				</Box>
				<Box className={clickable} is='li' onClick={(): void => setPlaceholder('contact.email')}>
					<Box mb='4px' style={{ width: '100%' }} fontScale='p2'>
						{t('Email')}
					</Box>
				</Box>
				<Box className={clickable} is='li' onClick={(): void => setPlaceholder('contact.phone')}>
					<Box mb='4px' style={{ width: '100%' }} fontScale='p2'>
						{t('Phone')}
					</Box>
				</Box>
			</Box>
			<Divider />
			<Box textTransform='uppercase' fontScale='c1' fontSize='10px'>
				{t('Agent')}
			</Box>
			<Box is='ul'>
				<Box className={clickable} is='li' onClick={(): void => setPlaceholder('agent.name')}>
					<Box mb='4px' style={{ width: '100%' }} fontScale='p2'>
						{t('Name')}
					</Box>
				</Box>
				<Box className={clickable} is='li' onClick={(): void => setPlaceholder('agent.email')}>
					<Box mb='4px' style={{ width: '100%' }} fontScale='p2'>
						{t('Email')}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default memo(InsertPlaceholderDropdown);
