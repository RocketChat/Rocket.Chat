import { Accordion, Box, Button, Field, InputBox } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type Props = {
	title?: string;
};

const BankTransfer = ({ title }: Props): ReactElement => (
	<Accordion.Item title={title}>
		<Box color='default' fontScale='p2'>
			<p style={{ fontSize: '16px' }}>You need to transfer 150 RMB to the bank act below </p>
			<Field>
				<Field.Label htmlFor='bank-1'>Bank 1</Field.Label>
				<Field.Row>
					<InputBox type='text' id='bank-1' defaultValue={3424323434} />
				</Field.Row>
				<Field.Label htmlFor='bank-2'>Bank 2</Field.Label>
				<Field.Row>
					<InputBox type='text' id='bank-2' defaultValue={6464534675} />
				</Field.Row>
				<Field.Label htmlFor='bank-3'>Bank 3</Field.Label>
				<Field.Row>
					<InputBox type='text' id='bank-3' defaultValue={1454254545} />
				</Field.Row>
				<Button primary style={{ marginTop: '12px' }}>
					I have transferred
				</Button>
			</Field>
		</Box>
	</Accordion.Item>
);

export default BankTransfer;
