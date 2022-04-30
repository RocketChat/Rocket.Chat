import { Modal, Button, ButtonGroup, Box, Margins } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';
import BottomBar from '../../components/BottomBar';
import Page from '../../components/Page';
import TopBar from '../../topbar/TopBar';

type Props = {
	title: string;
	body: string;
};

const LandingView = ({ title, body }: Props): ReactElement => (
	<Page flexDirection='row'>
		<Page>
			<TopBar />
			<h3>Top 10 Blog Posts</h3>
			<Page.Content>
				<Margins block='15px'>
					<Modal height='400px' width='350px'>
						<Box height='160px' width='full' bg='primary-500-50'></Box>
						<Modal.Header>
							<Modal.Title>{title}</Modal.Title>
						</Modal.Header>
						<Modal.Content>{body}</Modal.Content>
						<Modal.Footer>
							<ButtonGroup align='end'>
								<Button primary>Read More</Button>
							</ButtonGroup>
						</Modal.Footer>
					</Modal>
				</Margins>
			</Page.Content>
			<BottomBar />
		</Page>
	</Page>
);

export default LandingView;
