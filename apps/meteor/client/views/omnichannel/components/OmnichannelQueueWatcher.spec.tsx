import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { CustomSoundContext } from '@rocket.chat/ui-contexts';
import { render } from '@testing-library/react';
import type { ContextType } from 'react';

import OmnichannelQueueWatcher from './OmnichannelQueueWatcher';
import type { OmnichannelContextValue } from '../../../contexts/OmnichannelContext';
import { OmnichannelContext } from '../../../contexts/OmnichannelContext';
import { initializeLivechatInquiryStream } from '../../../lib/omnichannel/queueManager';

jest.mock('../../../lib/omnichannel/queueManager', () => ({
	initializeLivechatInquiryStream: jest.fn(),
}));

const notificationSounds = {
	playNewRoom: jest.fn(),
	playNewRoomLoop: jest.fn(),
	stopNewRoom: jest.fn(),
};

const customSound = { notificationSounds } as unknown as ContextType<typeof CustomSoundContext>;

const baseValue: OmnichannelContextValue = {
	inquiries: { enabled: false },
	enabled: true,
	isEnterprise: false,
	agentAvailable: true,
	showOmnichannelQueueLink: false,
	isOverMacLimit: false,
	livechatPriorities: { enabled: false, data: [], isLoading: false, isError: false },
};

const withQueue = (size: number): OmnichannelContextValue => ({
	...baseValue,
	inquiries: {
		enabled: true,
		queue: Array.from({ length: size }, (_, index) => ({ _id: `inquiry-${index}` }) as ILivechatInquiryRecord),
	},
});

const Harness = ({ value }: { value: OmnichannelContextValue }) => (
	<CustomSoundContext.Provider value={customSound}>
		<OmnichannelContext.Provider value={value}>
			<OmnichannelQueueWatcher />
		</OmnichannelContext.Provider>
	</CustomSoundContext.Provider>
);

const renderWatcher = (value: OmnichannelContextValue) => {
	const result = render(<Harness value={value} />, { wrapper: mockAppRoot().withJohnDoe().withSubscriptions([]).build() });

	return {
		...result,
		update: (next: OmnichannelContextValue) => result.rerender(<Harness value={next} />),
	};
};

describe('OmnichannelQueueWatcher', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders nothing', () => {
		const { container } = renderWatcher(baseValue);

		expect(container).toBeEmptyDOMElement();
	});

	it('does not start the inquiry stream while the queue is off', () => {
		renderWatcher(baseValue);

		expect(initializeLivechatInquiryStream).not.toHaveBeenCalled();
	});

	it('starts the inquiry stream for the agent once the queue is on', () => {
		renderWatcher(withQueue(0));

		expect(initializeLivechatInquiryStream).toHaveBeenCalledWith('john.doe');
	});

	it('plays the new-chat sound when the queue grows', () => {
		const { update } = renderWatcher(withQueue(1));
		notificationSounds.playNewRoom.mockClear();

		update(withQueue(2));

		expect(notificationSounds.playNewRoom).toHaveBeenCalledTimes(1);
	});

	it('stays quiet when the queue shrinks', () => {
		const { update } = renderWatcher(withQueue(2));
		notificationSounds.playNewRoom.mockClear();

		update(withQueue(1));

		expect(notificationSounds.playNewRoom).not.toHaveBeenCalled();
	});
});
