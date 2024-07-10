import { faker } from '@faker-js/faker';
import {
	Button,
	ButtonGroup,
	Divider,
	Field,
	FieldLabel,
	FieldRow,
	FieldHint,
	TextInput,
	ToggleSwitch,
	Box,
	// FieldGroup,
	Icon,
	Margins,
	ContextualbarEmptyContent,
} from '@rocket.chat/fuselage';
import { useEffectEvent, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Virtuoso } from 'react-virtuoso';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarActions,
	ContextualbarAction,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
} from '../../../../../components/Contextualbar';
import VirtuosoScrollbars from '../../../../../components/CustomScrollbars/VirtuosoScrollbars';
import DeleteContactGroupModal from '../DeleteContactGroupModal';
import ContactGroupMembersRow from './ContactGroupMembersRow';

type ContactGroupMembersProps = {
	onClose: () => void;
	onAddContacts: () => void;
};

// FIXME: FAKE DATA
const total = 1000;
const createFakeUser = () => ({
	id: faker.datatype.uuid(),
	username: faker.internet.userName(),
	name: faker.name.fullName(),
	status: faker.helpers.arrayElement(['away', 'busy', 'online', 'dnd']),
	phone: faker.phone.number(),
});

const ContactGroupMembers = ({ onClose, onAddContacts }: ContactGroupMembersProps) => {
	const t = useTranslation();
	const { control } = useForm();
	const setModal = useSetModal();

	const nameField = useUniqueId();
	const archivedField = useUniqueId();

	// const results = [];
	const results = Array.from({ length: 100 }, createFakeUser);

	const handleDeleteGroup = useEffectEvent(() =>
		setModal(<DeleteContactGroupModal onCancel={() => setModal(null)} onConfirm={() => console.log('group deleted')} />),
	);

	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Group')}</ContextualbarTitle>
				<ContextualbarActions>
					<ContextualbarAction onClick={onAddContacts} title={t('Add_contact')} name='user-plus' />
					<ContextualbarAction onClick={handleDeleteGroup} title={t('Delete_group')} danger name='trash' />
					<ContextualbarClose onClick={onClose} />
				</ContextualbarActions>
			</ContextualbarHeader>
			<Box pi={24} display='flex' flexDirection='column'>
				<Margins blockStart={16}>
					<Field>
						<FieldLabel htmlFor={nameField}>{t('Name')}</FieldLabel>
						<FieldRow>
							<Controller control={control} name='name' render={({ field }) => <TextInput id={nameField} {...field} />} />
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={archivedField}>{t('Archive')}</FieldLabel>
							<Controller
								control={control}
								name='archived'
								render={({ field: { onChange, value, ref } }) => (
									<ToggleSwitch id={archivedField} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</FieldRow>
						<FieldHint>When archived not visible to select</FieldHint>
					</Field>
				</Margins>
				<Divider mb={16} />
				<TextInput
					placeholder={t('Search')}
					// value={text}
					// ref={inputRef}
					// onChange={setText}
					addon={<Icon name='magnifier' size='x20' />}
				/>
			</Box>
			{results.length === 0 && <ContextualbarEmptyContent />}
			{results.length > 0 && (
				<ContextualbarContent p={12}>
					<Box pi={16} pbe={8}>
						<Box is='span' color='hint' fontScale='p2'>
							{t('Showing_current_of_total', { current: results.length, total })}
						</Box>
					</Box>
					<Box w='full' h='full' overflow='hidden' flexShrink={1}>
						<Virtuoso
							style={{
								height: '100%',
								width: '100%',
							}}
							totalCount={total}
							overscan={50}
							data={results}
							components={{ Scroller: VirtuosoScrollbars }}
							itemContent={(_, data) => <ContactGroupMembersRow {...data} />}
						/>
					</Box>
				</ContextualbarContent>
			)}
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary>{t('Save')}</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default ContactGroupMembers;
