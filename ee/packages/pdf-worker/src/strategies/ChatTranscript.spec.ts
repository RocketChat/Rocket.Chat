import i18next from 'i18next';
import moment from 'moment-timezone';

import { ChatTranscript } from './ChatTranscript';
import { invalidData, validData, newDayData, sameDayData } from '../templates/ChatTranscript/ChatTranscript.fixtures';

jest.mock('../templates/ChatTranscript', () => {
	return {
		exportTranscript: jest.fn(() => Promise.resolve()),
	};
});

beforeAll(() => {
	i18next.init({
		lng: 'en',
		resources: {
			en: {
				translation: {
					transcript: 'Transcript',
					visitor: 'Visitor',
					agent: 'Agent',
					date: 'Date',
					time: 'Time',
				},
			},
		},
	});
});

describe('Strategies/ChatTranscript', () => {
	let chatTranscript: ChatTranscript;

	beforeEach(() => {
		chatTranscript = new ChatTranscript();
	});

	it('should throws an error if data is not valid', () => {
		expect(() => {
			chatTranscript.renderTemplate(invalidData);
		}).toThrow('Invalid data');
	});

	it('should creates a divider for a first message', () => {
		const result = chatTranscript.parseTemplateData(validData, i18next);
		expect(result.messages[0]).toHaveProperty('divider');
	});

	it('should creates a divider if message is from a new day', () => {
		const result = chatTranscript.parseTemplateData(newDayData, i18next);
		expect(result.messages[0]).toHaveProperty('divider');
		expect(result.messages[1]).toHaveProperty(
			'divider',
			moment(newDayData.messages[1].ts).tz(newDayData.timezone).format(newDayData.dateFormat),
		);
	});

	it('should not create a divider if message is from the same day', () => {
		const result = chatTranscript.parseTemplateData(sameDayData, i18next);
		expect(result.messages[0]).toHaveProperty('divider');
		expect(result.messages[1]).not.toHaveProperty('divider');
	});

	it('should returns the correct translation value for a given key', () => {
		const result = chatTranscript.parseTemplateData(validData, i18next);
		expect(result.i18n.t('transcript')).toEqual('Transcript');
		expect(result.i18n.t('visitor')).toEqual('Visitor');
		expect(result.i18n.t('agent')).toEqual('Agent');
		expect(result.i18n.t('date')).toEqual('Date');
		expect(result.i18n.t('time')).toEqual('Time');
	});

	it('should parse the system message', () => {
		const result = chatTranscript.parseTemplateData(validData, i18next);
		expect(result.messages[2]).toHaveProperty('t', 'livechat-started');
	});
});
