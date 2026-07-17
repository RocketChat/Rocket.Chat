import { css } from '@rocket.chat/css-in-js';
import { TableRow } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

const alignTop = css`
	td {
		vertical-align: top;
	}
`;

export type GenericTableRowProps = ComponentPropsWithoutRef<typeof TableRow> & {
  cellVerticalAlign?: 'top';
};

export const GenericTableRow = ({
  cellVerticalAlign,
  className,
  ...props
}: GenericTableRowProps) => (
  <TableRow
    {...props}
    className={
      cellVerticalAlign === 'top'
        ? [className, alignTop]
        : className
    }
  />
);