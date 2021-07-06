import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { Story } from '@storybook/react';
import React from 'react';

import Card from '.';

export default {
	title: 'components/Card',
	component: Card,
};

export const Single: Story = () => (
	<Box p='x40'>
		<Card>
			<Card.Title>A card</Card.Title>
			<Card.Body>
				<Card.Col>
					<Box>
						<Card.Col.Title>A Section</Card.Col.Title>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
					</Box>
					<Box>
						<Card.Col.Title>Another Section</Card.Col.Title>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
					</Box>
				</Card.Col>
			</Card.Body>
			<Card.Footer>
				<ButtonGroup align='end'>
					<Button small>I'm a button in a footer</Button>
				</ButtonGroup>
			</Card.Footer>
		</Card>
	</Box>
);

export const Double: Story = () => (
	<Box p='x40'>
		<Card>
			<Card.Title>A card</Card.Title>
			<Card.Body>
				<Card.Col>
					<Box>
						<Card.Col.Title>A Section</Card.Col.Title>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
					</Box>
					<Box>
						<Card.Col.Title>Another Section</Card.Col.Title>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
					</Box>
				</Card.Col>
				<Card.Divider />
				<Card.Col>
					<Box>
						<Card.Col.Title>A Section</Card.Col.Title>
						<Box display='flex' flexDirection='row' alignItems='center'>
							<Card.Icon name='document-eye' />A bunch of stuff
						</Box>
						<Box display='flex' flexDirection='row' alignItems='center'>
							<Card.Icon name='pencil' />A bunch of stuff
						</Box>
						<Box display='flex' flexDirection='row' alignItems='center'>
							<Card.Icon name='cross' />A bunch of stuff
						</Box>
						<Box display='flex' flexDirection='row' alignItems='center'>
							<Card.Icon name='dialpad' />A bunch of stuff
						</Box>
					</Box>
					<Box>
						<Card.Col.Title>Another Section</Card.Col.Title>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
						<div>A bunch of stuff</div>
					</Box>
				</Card.Col>
			</Card.Body>
			<Card.Footer>
				<ButtonGroup align='end'>
					<Button small>I'm a button in a footer</Button>
				</ButtonGroup>
			</Card.Footer>
		</Card>
	</Box>
);
