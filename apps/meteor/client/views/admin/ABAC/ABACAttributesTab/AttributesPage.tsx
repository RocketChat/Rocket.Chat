import { Box, Button, Icon, Margins, Pagination, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
	usePagination,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AttributeMenu from './AttributeMenu';
import GenericNoResults from '../../../../components/GenericNoResults';
import { ABACQueryKeys } from '../../../../lib/queryKeys';
import { useIsABACAvailable } from '../hooks/useIsABACAvailable';

const AttributesPage = () => {
	const { t } = useTranslation();

	const searchTerm = useSearchParameter('searchTerm');
	const [text, setText] = useState(searchTerm ?? '');

	const debouncedText = useDebouncedValue(text, 400);
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const getAttributes = useEndpoint('GET', '/v1/abac/attributes');
	const isABACAvailable = useIsABACAvailable();

	const router = useRouter();
	const handleNewAttribute = useEffectEvent(() => {
		router.navigate({
			name: 'admin-ABAC',
			params: {
				tab: 'room-attributes',
				context: 'new',
			},
		});
	});

	const query = useMemo(
		() => ({
			...(debouncedText ? { key: debouncedText, values: debouncedText } : {}),
			offset: current,
			count: itemsPerPage,
		}),
		[debouncedText, current, itemsPerPage],
	);

	const { data, isLoading } = useQuery({
		queryKey: ABACQueryKeys.roomAttributes.list(query),
		queryFn: () => getAttributes(query),
	});

	return (
		<>
			<Margins block={24}>
				<Box display='flex'>
					<TextInput
						addon={<Icon name='magnifier' size='x20' />}
						placeholder={t('ABAC_Search_attributes')}
						value={text}
						onChange={(e) => setText((e.target as HTMLInputElement).value)}
					/>
					<Button onClick={handleNewAttribute} primary mis={8} disabled={!isABACAvailable}>
						{t('ABAC_New_attribute')}
					</Button>
				</Box>
			</Margins>
			{(!data || data.attributes?.length === 0) && !isLoading ? (
				<Box display='flex' justifyContent='center' height='full'>
					<GenericNoResults icon='list-alt' title={t('ABAC_No_attributes')} description={t('ABAC_No_attributes_description')} />
				</Box>
			) : (
				<>
					<GenericTable>
						<GenericTableHeader>
							<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('Value')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='spacer' w={40} />
						</GenericTableHeader>
						<GenericTableBody>
							{data?.attributes?.map((attribute) => (
								<GenericTableRow key={attribute._id}>
									<GenericTableCell withTruncatedText>{attribute.key}</GenericTableCell>
									<GenericTableCell withTruncatedText>{attribute.values.join(', ')}</GenericTableCell>
									<GenericTableCell>
										<AttributeMenu attribute={attribute} />
									</GenericTableCell>
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default AttributesPage;
