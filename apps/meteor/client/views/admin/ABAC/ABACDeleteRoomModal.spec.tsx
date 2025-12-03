import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';

import ABACDeleteRoomModal from './ABACDeleteRoomModal';

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		ABAC_Delete_room: 'Remove room from ABAC management',
		ABAC_Delete_room_annotation: 'Proceed with caution',
		ABAC_Delete_room_content: 'Removing <bold>{{roomName}}</bold> from ABAC management may result in unintended users gaining access.',
		Remove: 'Remove',
		Cancel: 'Cancel',
	})
	.build();

describe('ABACDeleteRoomModal', () => {
	it('should render without crashing', () => {
		const { baseElement } = render(<ABACDeleteRoomModal onClose={jest.fn()} onConfirm={jest.fn()} roomName='Test Room' />, {
			wrapper: appRoot,
		});

		expect(baseElement).toMatchSnapshot();
	});
});
