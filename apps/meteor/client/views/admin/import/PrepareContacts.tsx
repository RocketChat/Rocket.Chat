import type { IImporterSelectionContact } from '@rocket.chat/core-typings';
import { CheckBox, Table, Pagination, TableHead, TableRow, TableCell, TableBody } from '@rocket.chat/fuselage';
import type { Dispatch, SetStateAction, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { usePagination } from '../../../components/GenericTable/hooks/usePagination';

type PrepareContactsProps = {
	contactsCount: number;
	contacts: IImporterSelectionContact[];
	setContacts: Dispatch<SetStateAction<IImporterSelectionContact[]>>;
};

const PrepareContacts = ({ contactsCount, contacts, setContacts }: PrepareContactsProps) => {
	const { t } = useTranslation();
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	return (
		<>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell width='x36'>
							<CheckBox
								checked={contactsCount > 0}
								indeterminate={contactsCount > 0 && contactsCount !== contacts.length}
								onChange={(): void => {
									setContacts((contacts) => {
										const isChecking = contactsCount === 0;

										return contacts.map((contact) => ({ ...contact, do_import: isChecking }));
									});
								}}
							/>
						</TableCell>
						<TableCell is='th'>{t('Name')}</TableCell>
						<TableCell is='th'>{t('Emails')}</TableCell>
						<TableCell is='th'>{t('Phones')}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{contacts.slice(current, current + itemsPerPage).map((contact) => (
						<TableRow key={contact.id}>
							<TableCell width='x36'>
								<CheckBox
									checked={contact.do_import}
									onChange={(event: ChangeEvent<HTMLInputElement>): void => {
										const { checked } = event.currentTarget;
										setContacts((contacts) =>
											contacts.map((_contact) => (_contact === contact ? { ..._contact, do_import: checked } : _contact)),
										);
									}}
								/>
							</TableCell>
							<TableCell>{contact.name}</TableCell>
							<TableCell>{contact.emails.join('\n')}</TableCell>
							<TableCell>{contact.phones.join('\n')}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<Pagination
				current={current}
				itemsPerPage={itemsPerPage}
				count={contacts.length || 0}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
				{...paginationProps}
			/>
		</>
	);
};

export default PrepareContacts;
