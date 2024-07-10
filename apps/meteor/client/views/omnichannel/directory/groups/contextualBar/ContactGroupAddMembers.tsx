import { Button, ButtonGroup, Field, FieldLabel, TextInput, FieldGroup } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarBack,
} from '../../../../../components/Contextualbar';

type ContactGroupAddMembersProps = {
	onClickBack: () => void;
	onClose: () => void;
};

const ContactGroupAddMembers = ({ onClickBack, onClose }: ContactGroupAddMembersProps) => {
	const t = useTranslation();
	const { control } = useForm();

	const contactsField = useUniqueId();

	return (
		<Contextualbar>
			<ContextualbarHeader>
				{onClickBack && <ContextualbarBack onClick={onClickBack} />}
				<ContextualbarTitle>{t('Add_contacts')}</ContextualbarTitle>
				{onClose && <ContextualbarClose onClick={onClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={contactsField}>{t('Choose_users')}</FieldLabel>
						<Controller
							name='contacts'
							control={control}
							render={({ field }) => <TextInput id={contactsField} {...field} placeholder={t('Choose_users')} />}
						/>
					</Field>
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button primary>{t('Add_users')}</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default ContactGroupAddMembers;
