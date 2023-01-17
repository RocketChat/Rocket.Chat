import { useMediaQuery, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState, useCallback } from 'react';
import { Pagination, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import FilterByText from '../../../components/FilterByText';
import {
  GenericTable,
  GenericTableHeader,
  GenericTableHeaderCell,
  GenericTableBody,
  GenericTableLoadingTable,
} from '../../../components/GenericTable';
import { useDirectoryQuery } from '../hooks/useDirectoryQuery';
import { useSort } from '/client/components/GenericTable/hooks/useSort';
import { useQuery } from '@tanstack/react-query';
import { usePagination } from '/client/components/GenericTable/hooks/usePagination';
import ChannelsTableRow from './ChannelsTableRow';

function ChannelsTable() {
  const t = useTranslation();

  const directRoute = useRoute('direct');
  const [text, setText] = useState('');

  const { sortBy, sortDirection, setSort } = useSort<'name' | 'usersCount' | 'createdAt' | 'lastMessage'>('name')

  const mediaQuery = useMediaQuery('(min-width: 768px)');
  const debouncedText = useDebouncedValue(text, 500);

  const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

  const query = useDirectoryQuery(
    { text: debouncedText, current, itemsPerPage },
    [sortBy, sortDirection],
    'channels'
  );

  const header = useMemo(
    () =>
      [
        <GenericTableHeaderCell key={'name'} direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
          {t('Name')}
        </GenericTableHeaderCell>,
        <GenericTableHeaderCell
          key={'usersCount'}
          direction={sortDirection}
          active={sortBy === 'usersCount'}
          onClick={setSort}
          sort='usersCount'
          style={{ width: '100px' }}
        >
          {t('Users')}
        </GenericTableHeaderCell>,
        mediaQuery && (
          <GenericTableHeaderCell
            key={'createdAt'}
            direction={sortDirection}
            active={sortBy === 'createdAt'}
            onClick={setSort}
            sort='createdAt'
            style={{ width: '150px' }}
          >
            {t('Created_at')}
          </GenericTableHeaderCell>
        ),
        mediaQuery && (
          <GenericTableHeaderCell
            key={'lastMessage'}
            direction={sortDirection}
            active={sortBy === 'lastMessage'}
            onClick={setSort}
            sort='lastMessage'
            style={{ width: '150px' }}
          >
            {t('Last_Message')}
          </GenericTableHeaderCell>
        ),
        mediaQuery && (
          <GenericTableHeaderCell key={'belongsTo'} style={{ width: '150px' }}>
            {t('Belongs_To')}
          </GenericTableHeaderCell>
        ),
      ].filter(Boolean),
    [setSort, sortBy, sortDirection, t, mediaQuery],
  );

  const handleClick = useCallback(
    (name) => (e: React.KeyboardEvent | React.MouseEvent) => {
      if (e.type === 'click' || (e as React.KeyboardEvent).key === 'Enter') {
        directRoute.push({ rid: name });
      }
    },
    [directRoute],
  );

  const getDirectoryData = useEndpoint('GET', '/v1/directory');

  const { data, isFetched, isLoading } = useQuery(['getDirectoryData', query], () => getDirectoryData(query));

  return (
    <>
      <FilterByText autoFocus placeholder={t('Search_Users')} onChange={({ text }): void => setText(text)} />
      {isLoading && (
        <GenericTable>
          <GenericTableHeader>{header}</GenericTableHeader>
          <GenericTableBody>
            <GenericTableLoadingTable headerCells={5} />
          </GenericTableBody>
        </GenericTable>
      )}
      {data?.result && data.result.length > 0 && isFetched && (
        <>
          <GenericTable>
            <GenericTableHeader>{header}</GenericTableHeader>
            <GenericTableBody>
              {data.result.map((channel) => (
                <ChannelsTableRow
                  key={channel._id}
                  onClick={handleClick}
                  mediaQuery={mediaQuery}
                  channel={channel as any}
                />
              ))}
            </GenericTableBody>
          </GenericTable>
          <Pagination
            divider
            current={current}
            itemsPerPage={itemsPerPage}
            count={data?.total || 0}
            onSetItemsPerPage={onSetItemsPerPage}
            onSetCurrent={onSetCurrent}
            {...paginationProps}
          />
        </>
      )}
      {isFetched && data?.result.length === 0 && (
        <States>
          <StatesIcon name='magnifier' />
          <StatesTitle>{t('No_results_found')}</StatesTitle>
        </States>
      )}
    </>
  );
}

export default ChannelsTable;
