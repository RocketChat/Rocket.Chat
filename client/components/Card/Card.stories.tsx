import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Card from '.';
import TextSeparator from '../../views/admin/info/TextSeparator';
import { UserStatus } from '../UserStatus';

export default {
	title: 'Components/Card',
	component: Card,
	subcomponents: {
		'Card.Title': Card.Title,
		'Card.Body': Card.Body,
		'Card.Col': Card.Col,
		'Card.Col.Section': Card.Col.Section,
		'Card.Col.Title': Card.Col.Title,
		'Card.Footer': Card.Footer,
		'Card.Divider': Card.Divider,
	},
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof Card>;

export const Example: ComponentStory<typeof Card> = () => (
	<Card>
		<Card.Title>Usage</Card.Title>
		<Card.Body flexDirection='column'>
			<Card.Col.Section>
				<Card.Col.Title>Users</Card.Col.Title>
				<TextSeparator
					label={
						<>
							<Card.Icon name='dialpad' /> Total
						</>
					}
					value={123}
				/>
				<TextSeparator
					label={
						<>
							<Card.Icon>
								<UserStatus status='online' />
							</Card.Icon>{' '}
							Online
						</>
					}
					value={123}
				/>
				<TextSeparator
					label={
						<>
							<Card.Icon>
								<UserStatus status='busy' />
							</Card.Icon>{' '}
							Busy
						</>
					}
					value={123}
				/>
				<TextSeparator
					label={
						<>
							<Card.Icon>
								<UserStatus status='away' />
							</Card.Icon>{' '}
							Away
						</>
					}
					value={123}
				/>
				<TextSeparator
					label={
						<>
							<Card.Icon>
								<UserStatus status='offline' />
							</Card.Icon>{' '}
							Offline
						</>
					}
					value={123}
				/>
			</Card.Col.Section>
			<Card.Col.Section>
				<Card.Col.Title>Types and Distribution</Card.Col.Title>
				<TextSeparator label='Connected' value={123} />
				<TextSeparator label='Active Users' value={123} />
				<TextSeparator label='Active Guests' value={123} />
				<TextSeparator label='Non-Active Users' value={123} />
				<TextSeparator label='App Users' value={123} />
			</Card.Col.Section>
			<Card.Col.Section>
				<Card.Col.Title>Uploads</Card.Col.Title>
				<TextSeparator label='Total Uploads' value={123} />
				<TextSeparator label='Total Uploads (size)' value='123 GB' />
			</Card.Col.Section>
		</Card.Body>
	</Card>
);

export const Single: ComponentStory<typeof Card> = () => (
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
);

export const Double: ComponentStory<typeof Card> = () => (
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
);
