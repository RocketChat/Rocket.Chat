import React, { ReactElement, useCallback, useMemo, useState } from "react";
import { useAutoFocus, useDebouncedValue, useMediaQuery } from "@rocket.chat/fuselage-hooks";
import { usePermission, useRoute, useTranslation } from "@rocket.chat/ui-contexts";
import GenericTable from '../../components/GenericTable';
import FilterByText from '../../components/FilterByText';
import { useFormatDate } from "/client/hooks/useFormatDate";
import { Box, Flex, Table } from "@rocket.chat/fuselage";
import UserAvatar from "/client/components/avatar/UserAvatar";
import MarkdownText from "/client/components/MarkdownText";
import { useEndpointData } from "/client/hooks/useEndpointData";

type UserParamsType = {
  text?: string;
  current: number;
  itemsPerPage: 25 | 50 | 100;
}

function useQuery(
  { text, itemsPerPage, current }: { text?: string; current: number; itemsPerPage: number },
  [column, direction]: [string, 'asc' | 'desc'],
  type: string,
  workspace = 'local',
): { offset?: number | undefined; count?: number; query: string; sort: string } {
  return useMemo(
    () => ({
      query: JSON.stringify({
        type,
        text,
        workspace,
      }),
      sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
      ...(itemsPerPage && { count: itemsPerPage }),
      ...(current && { offset: current }),
    }),
    [itemsPerPage, current, column, direction, type, workspace, text],
  );
}


function UserTable(props: { workspace?: 'external' | 'local' }): ReactElement {
  const t = useTranslation();
  const [params, setParams] = useState<UserParamsType>({
    text: '',
    current: 0,
    itemsPerPage: 25,
  });
  const [text, setText] = useState('');
  const [sort, setSort] = useState<[string, 'asc' | 'desc']>(['name', 'asc']);
  const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');

  const federation = props.workspace === 'external';

  const mediaQuery = useMediaQuery('(min-width: 1024px)');

  const onHeaderClick = useCallback(
    (id) => {
      const [sortBy, sortDirection] = sort;

      if (sortBy === id) {
        setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
        return;
      }
      setSort([id, 'asc']);
    },
    [sort],
  );

  const header = useMemo(
    () =>
      [
        <GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>
          {t('Name')}
        </GenericTable.HeaderCell>,
        mediaQuery && canViewFullOtherUserInfo && (
          <GenericTable.HeaderCell
            key={'email'}
            direction={sort[1]}
            active={sort[0] === 'email'}
            onClick={onHeaderClick}
            sort='email'
            style={{ width: '200px' }}
          >
            {t('Email')}
          </GenericTable.HeaderCell>
        ),
        federation && (
          <GenericTable.HeaderCell
            key={'origin'}
            direction={sort[1]}
            active={sort[0] === 'origin'}
            onClick={onHeaderClick}
            sort='origin'
            style={{ width: '200px' }}
          >
            {t('Domain')}
          </GenericTable.HeaderCell>
        ),
        mediaQuery && (
          <GenericTable.HeaderCell
            key={'createdAt'}
            direction={sort[1]}
            active={sort[0] === 'createdAt'}
            onClick={onHeaderClick}
            sort='createdAt'
            style={{ width: '200px' }}
          >
            {t('Joined_at')}
          </GenericTable.HeaderCell>
        ),
      ].filter(Boolean),
    [sort, onHeaderClick, t, mediaQuery, canViewFullOtherUserInfo, federation],
  );

  const directRoute = useRoute('direct');

  const debouncedParams = useDebouncedValue(params, 500);
  const debouncedSort = useDebouncedValue(sort, 500);

  const query = useQuery(debouncedParams, debouncedSort, 'users', props.workspace);

  const endpointData = useEndpointData('/v1/directory', {
    ...query,
    text: params.text || '',
    workspace: props.workspace || 'local',
    type: ''
  });
  const { value: data } = endpointData;

  const onClick = useCallback(
    (username) => (e: any) => {
      if (e.type === 'click' || e.key === 'Enter') {
        directRoute.push({ rid: username });
      }
    },
    [directRoute],
  );

  const formatDate = useFormatDate();

  const renderRow = useCallback(
    ({ createdAt, emails, _id, username, name, domain, bio, avatarETag, nickname }) => (
      <Table.Row key={_id} onKeyDown={onClick(username)} onClick={onClick(username)} tabIndex={0} role='link' action>
        <Table.Cell>
          <Flex.Container>
            <Box>
              <Flex.Item>
                <UserAvatar size='x40' title={username} username={username} etag={avatarETag} />
              </Flex.Item>
              <Box withTruncatedText mi='x8'>
                <Box display='flex'>
                  <Box fontScale='p2m' withTruncatedText>
                    {name || username}
                    {nickname && ` (${nickname})`}
                  </Box>{' '}
                  <Box mi='x4' />{' '}
                  <Box fontScale='p2' color='hint' withTruncatedText>
                    {username}
                  </Box>
                </Box>
                <MarkdownText variant='inline' fontScale='p2' color='hint' content={bio} />
              </Box>
            </Box>
          </Flex.Container>
        </Table.Cell>
        {mediaQuery && canViewFullOtherUserInfo && (
          <Table.Cell withTruncatedText>{emails && emails.length && emails[0].address}</Table.Cell>
        )}
        {federation && <Table.Cell withTruncatedText>{domain}</Table.Cell>}
        {mediaQuery && (
          <Table.Cell fontScale='p2' color='hint' withTruncatedText>
            {formatDate(createdAt)}
          </Table.Cell>
        )}
      </Table.Row>
    ),
    [mediaQuery, federation, canViewFullOtherUserInfo, formatDate, onClick],
  );

  const refAutoFocus: any = useAutoFocus(true);

  return (
    <GenericTable
      header={header}
      renderFilter={({ onChange, ...props }: any): ReactElement => (
        <FilterByText onChange={onChange} inputRef={refAutoFocus} {...props} />
      )}
      renderRow={renderRow}
      results={data?.result}
      setParams={setParams}
      total={data?.total}
    />
  );
}

export default UserTable;
