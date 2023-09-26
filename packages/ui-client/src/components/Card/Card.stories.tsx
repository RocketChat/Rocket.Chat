import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { Card, CardBody, CardCol, CardColSection, CardColTitle, CardDivider, CardFooter, CardIcon, CardTitle } from '.';
import TextSeparator from '../TextSeparator';
import { UserStatus } from '../UserStatus';

export default {
	title: 'Components/Card',
	component: Card,
	subcomponents: {
		CardTitle,
		CardBody,
		CardCol,
		CardColSection,
		CardColTitle,
		CardFooter,
		CardDivider,
	},
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof Card>;

export const Example: ComponentStory<typeof Card> = () => (
	<Card>
		<CardTitle>Usage</CardTitle>
		<CardBody flexDirection='column'>
			<CardColSection>
				<CardColTitle>Users</CardColTitle>
				<TextSeparator
					label={
						<>
							<CardIcon name='dialpad' /> Total
						</>
					}
					value={123}
				/>
				<TextSeparator
					label={
						<>
							<CardIcon>
								<UserStatus status='online' />
							</CardIcon>{' '}
							Online
						</>
					}
					value={123}
				/>
				<TextSeparator
					label={
						<>
							<CardIcon>
								<UserStatus status='busy' />
							</CardIcon>{' '}
							Busy
						</>
					}
					value={123}
				/>
				<TextSeparator
					label={
						<>
							<CardIcon>
								<UserStatus status='away' />
							</CardIcon>{' '}
							Away
						</>
					}
					value={123}
				/>
				<TextSeparator
					label={
						<>
							<CardIcon>
								<UserStatus status='offline' />
							</CardIcon>{' '}
							Offline
						</>
					}
					value={123}
				/>
			</CardColSection>
			<CardColSection>
				<CardColTitle>Types and Distribution</CardColTitle>
				<TextSeparator label='Connected' value={123} />
				<TextSeparator label='Active Users' value={123} />
				<TextSeparator label='Active Guests' value={123} />
				<TextSeparator label='Non-Active Users' value={123} />
				<TextSeparator label='App Users' value={123} />
			</CardColSection>
			<CardColSection>
				<CardColTitle>Uploads</CardColTitle>
				<TextSeparator label='Total Uploads' value={123} />
				<TextSeparator label='Total Uploads (size)' value='123 GB' />
			</CardColSection>
		</CardBody>
	</Card>
);

export const Single: ComponentStory<typeof Card> = () => (
	<Card>
		<CardTitle>A card</CardTitle>
		<CardBody>
			<CardCol>
				<Box>
					<CardColTitle>A Section</CardColTitle>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
				</Box>
				<Box>
					<CardColTitle>Another Section</CardColTitle>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
				</Box>
			</CardCol>
		</CardBody>
		<CardFooter>
			<ButtonGroup align='end'>
				<Button small>I'm a button in a footer</Button>
			</ButtonGroup>
		</CardFooter>
	</Card>
);

export const Double: ComponentStory<typeof Card> = () => (
	<Card>
		<CardTitle>A card</CardTitle>
		<CardBody>
			<CardCol>
				<Box>
					<CardColTitle>A Section</CardColTitle>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
				</Box>
				<Box>
					<CardColTitle>Another Section</CardColTitle>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
				</Box>
			</CardCol>
			<CardDivider />
			<CardCol>
				<Box>
					<CardColTitle>A Section</CardColTitle>
					<Box display='flex' flexDirection='row' alignItems='center'>
						<CardIcon name='document-eye' />A bunch of stuff
					</Box>
					<Box display='flex' flexDirection='row' alignItems='center'>
						<CardIcon name='pencil' />A bunch of stuff
					</Box>
					<Box display='flex' flexDirection='row' alignItems='center'>
						<CardIcon name='cross' />A bunch of stuff
					</Box>
					<Box display='flex' flexDirection='row' alignItems='center'>
						<CardIcon name='dialpad' />A bunch of stuff
					</Box>
				</Box>
				<Box>
					<CardColTitle>Another Section</CardColTitle>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
					<div>A bunch of stuff</div>
				</Box>
			</CardCol>
		</CardBody>
		<CardFooter>
			<ButtonGroup align='end'>
				<Button small>I'm a button in a footer</Button>
			</ButtonGroup>
		</CardFooter>
	</Card>
);
