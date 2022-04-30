import { Button, Margins, Modal } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { IGame } from '../../../definition/IGame';
import DetailPageHeader from '../../components/DetailPageHeader/DetailPageHeader';

const SingleGameDetails = ({ description }: Partial<IGame>): ReactElement => (
	<>
		<DetailPageHeader title='Game1' route='games' />
		<Margins block='15px'>
			<Modal>
				<Modal.Content>
					<h4>Description</h4>
					<p>{description}</p>
				</Modal.Content>
				<Modal.Footer>
					<Button>Play</Button>
				</Modal.Footer>
			</Modal>
		</Margins>
	</>
);

export default SingleGameDetails;
