import { Table } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

export const GenericTableRow: FC<ComponentProps<typeof Table.Row>> = (props) => <Table.Row {...props} />;
