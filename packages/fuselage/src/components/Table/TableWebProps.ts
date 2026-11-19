import type { HTMLAttributes } from 'react';

import type { TableCellContract, TableContract, TableRowContract, TableSectionContract } from './Table.contract';
import type { WebInteractionHandlers } from '../../helpers/pickWebInteractionHandlers';
import type { WebPressAlias, WebProps, WebTagAttributes } from '../../types/WebAttributes';

type Common<TElement extends Element> = WebPressAlias<TElement> & Pick<HTMLAttributes<TElement>, 'title' | 'tabIndex'>;

export type WebTableProps = WebProps<TableContract, HTMLTableElement> & Common<HTMLTableElement>;

export type WebTableSectionProps = WebProps<TableSectionContract, HTMLTableSectionElement> & Common<HTMLTableSectionElement>;

export type WebTableRowProps = WebProps<TableRowContract, HTMLTableRowElement> &
	Common<HTMLTableRowElement> &
	WebInteractionHandlers<HTMLTableRowElement>;

export type WebTableCellProps = WebProps<TableCellContract, HTMLTableCellElement> &
	Common<HTMLTableCellElement> &
	WebInteractionHandlers<HTMLTableCellElement> &
	WebTagAttributes<'td' | 'th'>;
