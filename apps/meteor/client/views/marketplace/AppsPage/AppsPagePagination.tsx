import React, { useRef } from 'react';
import { Pagination } from '@rocket.chat/fuselage';

type Props = {
  current: number;
  itemsPerPage: 25 | 50 | 100;
  total: number;
  onSetItemsPerPage: React.Dispatch<React.SetStateAction<25 | 50 | 100>>;
  onSetCurrent: React.Dispatch<React.SetStateAction<number>>;
}

const AppsPagePagination = ({ current, itemsPerPage, total = 0, onSetItemsPerPage, onSetCurrent, ...paginationProps }: Props) => {
  const scrollableRef = useRef<HTMLDivElement>(null);

  return (
    <Pagination
      divider
      current={current}
      itemsPerPage={itemsPerPage}
      count={total}
      onSetItemsPerPage={onSetItemsPerPage}
      onSetCurrent={(value) => {
        onSetCurrent(value);
        scrollableRef.current?.scrollTo(0, 0);
      }}
      bg='light'
      {...paginationProps}
    />
  )
}

export default AppsPagePagination