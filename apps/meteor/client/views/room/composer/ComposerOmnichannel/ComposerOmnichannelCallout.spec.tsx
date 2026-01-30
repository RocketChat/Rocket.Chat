import { faker } from '@faker-js/faker/locale/af_ZA';
import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ComposerOmnichannelCallout from './ComposerOmnichannelCallout';
import FakeRoomProvider from '../../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeContact, createFakeRoom } from '../../../../../tests/mocks/data';

jest.mock('../../../omnichannel/contactInfo/tabs/ContactInfoChannels/useBlockChannel', () => ({
	useBlockChannel: () => jest.fn(),
}));

const fakeVisitor = {
	_id: faker.string.uuid(),
	token: faker.string.uuid(),
	username: faker.internet.userName(),
};

const fakeRoom = createFakeRoom<IOmnichannelRoom>({ t: 'l', v: fakeVisitor });
const fakeContact = createFakeContact();

it('should be displayed if contact is unknown', async () => {
	const getContactMockFn = jest.fn().mockResolvedValue({ contact: fakeContact });
	const wrapper = mockAppRoot().withEndpoint('GET', '/v1/omnichannel/contacts.get', getContactMockFn).withRoom(fakeRoom);

	render(
		<FakeRoomProvider roomOverrides={fakeRoom}>
			<ComposerOmnichannelCallout />
		</FakeRoomProvider>,
		{ wrapper: wrapper.build() },
	);

	await waitFor(() => expect(getContactMockFn).toHaveBeenCalled());
	expect(screen.getByText('Unknown_contact_callout_description')).toBeVisible();
	expect(screen.getByRole('button', { name: 'Add_contact' })).toBeVisible();
	expect(screen.getByRole('button', { name: 'Block' })).toBeVisible();
	expect(screen.getByRole('button', { name: 'Dismiss' })).toBeVisible();
});

it('should not be displayed if contact is known', async () => {
	const getContactMockFn = jest.fn().mockResolvedValue({ contact: createFakeContact({ unknown: false }) });
	const wrapper = mockAppRoot().withEndpoint('GET', '/v1/omnichannel/contacts.get', getContactMockFn).withRoom(fakeRoom);

	render(
		<FakeRoomProvider roomOverrides={fakeRoom}>
			<ComposerOmnichannelCallout />
		</FakeRoomProvider>,
		{ wrapper: wrapper.build() },
	);

	await waitFor(() => expect(getContactMockFn).toHaveBeenCalled());
	expect(screen.queryByText('Unknown_contact_callout_description')).not.toBeInTheDocument();
});

it('should hide callout on dismiss', async () => {
	const getContactMockFn = jest.fn().mockResolvedValue({ contact: fakeContact });
	const wrapper = mockAppRoot().withEndpoint('GET', '/v1/omnichannel/contacts.get', getContactMockFn).withRoom(fakeRoom);

	render(
		<FakeRoomProvider roomOverrides={fakeRoom}>
			<ComposerOmnichannelCallout />
		</FakeRoomProvider>,
		{ wrapper: wrapper.build() },
	);

	await waitFor(() => expect(getContactMockFn).toHaveBeenCalled());
	expect(screen.getByText('Unknown_contact_callout_description')).toBeVisible();

	const btnDismiss = screen.getByRole('button', { name: 'Dismiss' });
	await userEvent.click(btnDismiss);

	expect(screen.queryByText('Unknown_contact_callout_description')).not.toBeInTheDocument();
});
