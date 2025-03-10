import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import moment from 'moment';

import { SecurityLogDisplay } from './SecurityLogDisplayModal';

let type = 'string';

jest.mock('@rocket.chat/ui-contexts', () => {
	const originalModule = jest.requireActual('@rocket.chat/ui-contexts');

	return {
		__esModule: true,
		...originalModule,
		useSettingStructure: () => ({ type }),
	};
});

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

		const changedFromCode = screen.queryAllByRole('code')[0];
		expect(changedFromCode).toBeUndefined();

		const changedFrom = screen.getByText(props.changedFrom);
		expect(changedFrom).toBeVisible();

		const changedTo = screen.getByText(props.changedTo);
		expect(changedTo).toBeVisible();
	});

	it('should display code type settings', () => {
		type = 'code';
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
				changedFrom={props.changedFrom}
				changedTo={props.changedTo}
				onCancel={() => undefined}
			/>,
			{ wrapper: mockAppRoot().withJohnDoe().build() },
		);

		const changedFromCode = screen.queryAllByRole('code')[0];

		expect(changedFromCode).toHaveTextContent(props.changedFrom);
	});
});
