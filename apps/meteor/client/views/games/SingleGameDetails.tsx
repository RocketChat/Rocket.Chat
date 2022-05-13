import { Button, Margins, Modal } from '@rocket.chat/fuselage';
import React, { ReactElement, useContext } from 'react';

import DetailPageHeader from '../../components/DetailPageHeader/DetailPageHeader';
import { DispatchGameGlobalContext, GameGlobalContext } from '../../contexts/GameDetailContext/GlobalState';

const SingleGameDetails = (): ReactElement => {
	const { value } = useContext(GameGlobalContext);
	const { title, description } = value;
	return (
		<>
			<DetailPageHeader title={title} route='games' context={DispatchGameGlobalContext} />
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
};

export default SingleGameDetails;
