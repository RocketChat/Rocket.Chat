import { Table } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

export const GenericTableRow: FC<ComponentProps<typeof Table.Row>> = (props) => <Table.Row {...props} />;
