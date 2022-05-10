/* eslint-disable @typescript-eslint/camelcase */
import { CheckBox, Table, Tag, Pagination } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useCallback, FC, Dispatch, SetStateAction, ChangeEvent } from 'react';

type UserDescriptor = {
	user_id: string;
	username: string;
	email: string;
	is_deleted: boolean;
	do_import: boolean;
};

type PrepareUsersProps = {
	usersCount: number;
	users: UserDescriptor[];
	setUsers: Dispatch<SetStateAction<UserDescriptor[]>>;
};

const PrepareUsers: FC<PrepareUsersProps> = ({ usersCount, users, setUsers }) => {
	const t = useTranslation();
	const [current, setCurrent] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState<25 | 50 | 100>(25);
	const showingResultsLabel = useCallback(
		({ count, current, itemsPerPage }) => t('Showing_results_of', current + 1, Math.min(current + itemsPerPage, count), count),
		[t],
	);
	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), [t]);

	return (
		<>
			<Table>
				<Table.Head>
					<Table.Row>
						<Table.Cell width='x36'>
							<CheckBox
								checked={usersCount > 0}
								indeterminate={usersCount > 0 && usersCount !== users.length}
								onChange={(): void => {
									setUsers((users) => {
										const hasCheckedDeletedUsers = users.some(({ is_deleted, do_import }) => is_deleted && do_import);
										const isChecking = usersCount === 0;

										if (isChecking) {
											return users.map((user) => ({ ...user, do_import: true }));
										}

										if (hasCheckedDeletedUsers) {
											return users.map((user) => (user.is_deleted ? { ...user, do_import: false } : user));
										}

										return users.map((user) => ({ ...user, do_import: false }));
									});
								}}
							/>
						</Table.Cell>
						<Table.Cell is='th'>{t('Username')}</Table.Cell>
						<Table.Cell is='th'>{t('Email')}</Table.Cell>
						<Table.Cell is='th'></Table.Cell>
					</Table.Row>
				</Table.Head>
				<Table.Body>
					{users.slice(current, current + itemsPerPage).map((user) => (
						<Table.Row key={user.user_id}>
							<Table.Cell width='x36'>
								<CheckBox
									checked={user.do_import}
									onChange={(event: ChangeEvent<HTMLInputElement>): void => {
										const { checked } = event.currentTarget;
										setUsers((users) => users.map((_user) => (_user === user ? { ..._user, do_import: checked } : _user)));
									}}
								/>
							</Table.Cell>
							<Table.Cell>{user.username}</Table.Cell>
							<Table.Cell>{user.email}</Table.Cell>
							<Table.Cell align='end'>{user.is_deleted && <Tag variant='danger'>{t('Deleted')}</Tag>}</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table>
			<Pagination
				current={current}
				itemsPerPage={itemsPerPage}
				count={users.length || 0}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
				itemsPerPageLabel={itemsPerPageLabel}
				showingResultsLabel={showingResultsLabel}
			/>
		</>
	);
};

export default PrepareUsers;
