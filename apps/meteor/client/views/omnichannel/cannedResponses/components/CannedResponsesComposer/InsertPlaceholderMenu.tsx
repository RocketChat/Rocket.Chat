import { GenericMenu } from '@rocket.chat/ui-client';
import type { RefObject } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import InsertPlaceholderButton from './InsertPlaceholderButton';

export type InsertPlaceholderMenuProps = {
	textAreaRef: RefObject<HTMLTextAreaElement | null>;
	onChange: (value: string) => void;
};

/**
 * Inserts a contact or agent placeholder at the caret of the canned response's text area.
 */
const InsertPlaceholderMenu = ({ textAreaRef, onChange }: InsertPlaceholderMenuProps) => {
	const { t } = useTranslation();

	const insert = (name: string) => {
		const textArea = textAreaRef.current;
		if (!textArea) {
			return;
		}

		const text = textArea.value;
		const startPos = textArea.selectionStart;
		const placeholder = `{{${name}}}`;

		textArea.value = text.slice(0, startPos) + placeholder + text.slice(startPos);
		textArea.focus();
		textArea.setSelectionRange(startPos + placeholder.length, startPos + placeholder.length);

		onChange(textArea.value);
	};

	const item = (name: string, label: string) => ({ id: name, content: label, onClick: () => insert(name) });

	return (
		<GenericMenu
			title={t('Insert_Placeholder')}
			button={<InsertPlaceholderButton />}
			placement='bottom-start'
			sections={[
				{
					title: t('Contact'),
					items: [item('contact.name', t('Name')), item('contact.email', t('Email')), item('contact.phone', t('Phone'))],
				},
				{ title: t('Agent'), items: [item('agent.name', t('Name')), item('agent.email', t('Email'))] },
			]}
			onOpenChange={(isOpen: boolean) => {
				if (!isOpen) {
					textAreaRef.current?.focus();
				}
			}}
		/>
	);
};

export default memo(InsertPlaceholderMenu);
