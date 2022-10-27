import { Box, Table, Button } from '@rocket.chat/fuselage';
import { useAutoFocus, useLocalStorage, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, ReactElement, FC } from 'react';

import { popover } from '../../../app/ui-utils/client';
import CreateCategory from '../../components/CreateCategory';
import FilterByText from '../../components/FilterByText';
import GenericTable from '../../components/GenericTable';

const useReactModal = (Component: FC<any>): ((e: React.MouseEvent<HTMLElement>) => void) => {
	const setModal = useSetModal();

	return useMutableCallback((e) => {
		popover.close();

		e.preventDefault();

		const handleClose = (): void => {
			setModal(null);
		};

		setModal(() => <Component onClose={handleClose} />);
	});
};

const CategoriesTable = (): ReactElement => {
	const t = useTranslation();

	const refAutoFocus = useAutoFocus(true);

	const createCategory = useReactModal(CreateCategory);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'name'}>Category</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'channelsCount'}>{t('Channels')}</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'createdAt'} sort='createdAt' style={{ width: '150px' }}>
					{t('Created_at')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[t],
	);

	const [category] = useLocalStorage('rc-category', {});

	const data = Object.entries(category);

	const renderRow = useCallback((category) => {
		const { 0: name, 1: channels } = category;

		return (
			<Table.Row key={category[0]} tabIndex={0} role='link' action>
				<Table.Cell>{name}</Table.Cell>
				<Table.Cell fontScale='p2' color='hint'>
					{channels.map((channel) => channel)}
				</Table.Cell>
				<Table.Cell fontScale='p2' color='hint'>
					{new Date().toDateString()}
				</Table.Cell>
			</Table.Row>
		);
	}, []);

	return (
		<GenericTable
			header={header}
			renderFilter={({ onChange, ...props }) => (
				<Box display='flex' alignItems='center'>
					<FilterByText placeholder='Search Groups' inputRef={refAutoFocus} onChange={onChange} {...props} />
					<Button primary onClick={createCategory} mis='x6'>
						Add Category
					</Button>
				</Box>
			)}
			renderRow={renderRow}
			results={data}
			total={Object.keys(category).length}
		/>
	);
};

export default CategoriesTable;
