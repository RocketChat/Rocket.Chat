import { Accordion, Box, Button, Field, InputBox } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type Props = {
	title?: string;
};

const PerfectMoneyVoucher = ({ title }: Props): ReactElement => (
	<Accordion.Item title={title} defaultExpanded>
		<Box color='default' fontScale='p2'>
			<h4>Enter your voucher</h4>
			<Field>
				<Field.Row>
					<Field.Label htmlFor='e-voucher-number'>E-voucher number</Field.Label>
					<InputBox type='text' id='e-voucher-number' />
				</Field.Row>
				<Field.Row>
					<Field.Label htmlFor='activation-code'>Activation code</Field.Label>
					<InputBox type='text' id='activation-code' />
				</Field.Row>
				<Button primary style={{ marginTop: '12px' }}>
					Submit
				</Button>
				<Field.Link href='#' style={{ marginTop: '5px' }}>
					How to buy e-voucher?
				</Field.Link>
			</Field>
		</Box>
	</Accordion.Item>
);

export default PerfectMoneyVoucher;
