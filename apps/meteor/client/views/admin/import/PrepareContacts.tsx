import type { IImporterSelectionContact } from '@rocket.chat/core-typings';
import { CheckBox, Table, Pagination, TableHead, TableRow, TableCell, TableBody } from '@rocket.chat/fuselage';
import type { Dispatch, SetStateAction, ChangeEvent } from 'react';
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type PrepareContactsProps = {
	contactsCount: number;
	contacts: IImporterSelectionContact[];
	setContacts: Dispatch<SetStateAction<IImporterSelectionContact[]>>;
};

const PrepareContacts = ({ contactsCount, contacts, setContacts }: PrepareContactsProps) => {
	const { t } = useTranslation();
	const [current, setCurrent] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState<25 | 50 | 100>(25);
	const showingResultsLabel = useCallback(
		({ count, current, itemsPerPage }) =>
			t('Showing_results_of', {
				postProcess: 'sprintf',
				sprintf: [current + 1, Math.min(current + itemsPerPage, count), count],
			}),
		[t],
	);
	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), [t]);

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
				itemsPerPageLabel={itemsPerPageLabel}
				showingResultsLabel={showingResultsLabel}
			/>
		</>
	);
};

export default PrepareContacts;
