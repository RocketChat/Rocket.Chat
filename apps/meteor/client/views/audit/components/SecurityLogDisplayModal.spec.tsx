import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import moment from 'moment';

import { SecurityLogDisplay } from './SecurityLogDisplayModal';

describe('SecurityLogDisplay', () => {
	it('should render', () => {
		const props = {
			timestamp: '2021-10-01T00:00:00.000Z',
			actor: 'John Doe',
			setting: 'Show_message_in_email_notification',
			settingType: 'string' as const,
			changedFrom: 'false',
			changedTo: 'true',
		};

		render(
			<SecurityLogDisplay
				timestamp={props.timestamp}
				actor={props.actor}
				setting={props.setting}
				settingType={props.settingType}
				changedFrom={props.changedFrom}
				changedTo={props.changedTo}
				onCancel={() => undefined}
			/>,
			{ wrapper: mockAppRoot().withJohnDoe().build() },
		);
	});

	it('should display the correct data', () => {
		const props = {
			timestamp: '2021-10-01T00:00:00.000Z',
			actor: 'John Doe',
			setting: 'Show_message_in_email_notification',
			settingType: 'string' as const,
			changedFrom: 'false',
			changedTo: 'true',
		};

		render(
			<SecurityLogDisplay
				timestamp={props.timestamp}
				actor={props.actor}
				setting={props.setting}
				settingType={props.settingType}
				changedFrom={props.changedFrom}
				changedTo={props.changedTo}
				onCancel={() => undefined}
			/>,
			{ wrapper: mockAppRoot().withJohnDoe().build() },
		);

		const timestamp = screen.getByText(moment(props.timestamp).format('MMMM Do YYYY, h:mm:ss a'));
		expect(timestamp).toBeVisible();

		const actor = screen.getByText(props.actor);
		expect(actor).toBeVisible();

		const actorAvatar = screen.getByTitle(props.actor);
		expect(actorAvatar).toBeVisible();

		const setting = screen.getByText(props.setting);
		expect(setting).toBeVisible();

		const changedFromCode = screen.queryByLabelText('code_setting');
		expect(changedFromCode).toBeNull();

		const changedFrom = screen.getByText(props.changedFrom);
		expect(changedFrom).toBeVisible();

		const changedTo = screen.getByText(props.changedTo);
		expect(changedTo).toBeVisible();
	});

	it('should display code type settings', () => {
		const props = {
			timestamp: '2021-10-01T00:00:00.000Z',
			actor: 'John Doe',
			setting: 'Show_message_in_email_notification',
			settingType: 'code' as const,
			changedFrom: 'console.log("Hello, World!")',
			changedTo: 'console.log("GoodBye, World!")',
		};

		render(
			<SecurityLogDisplay
				timestamp={props.timestamp}
				actor={props.actor}
				setting={props.setting}
				settingType={props.settingType}
				changedFrom={props.changedFrom}
				changedTo={props.changedTo}
				onCancel={() => undefined}
			/>,
			{ wrapper: mockAppRoot().withJohnDoe().build() },
		);

		const changedFrom = screen.queryAllByLabelText('code_setting')[0];
		expect(changedFrom).toBeVisible();
	});
});
