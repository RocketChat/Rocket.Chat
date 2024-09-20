import moment from 'moment-timezone';

import { invalidData, validData, newDayData, sameDayData, translationsData } from '../templates/ChatTranscript/ChatTranscript.fixtures';
import { ChatTranscript } from './ChatTranscript';

jest.mock('../templates/ChatTranscript', () => {
	return {
		exportTranscript: jest.fn(() => Promise.resolve()),
	};
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
		const result = chatTranscript.parseTemplateData(validData);
		expect(result.messages[0]).toHaveProperty('divider');
	});

	it('should creates a divider if message is from a new day', () => {
		const result = chatTranscript.parseTemplateData(newDayData);
		expect(result.messages[0]).toHaveProperty('divider');
		expect(result.messages[1]).toHaveProperty(
			'divider',
			moment(newDayData.messages[1].ts).tz(newDayData.timezone).format(newDayData.dateFormat),
		);
	});

	it('should not create a divider if message is from the same day', () => {
		const result = chatTranscript.parseTemplateData(sameDayData);
		expect(result.messages[0]).toHaveProperty('divider');
		expect(result.messages[1]).not.toHaveProperty('divider');
	});

	it('should returns the correct translation value for a given key', () => {
		const data = { ...validData, translations: translationsData.translations };
		const result = chatTranscript.parseTemplateData(data);
		expect(result.t('transcript')).toEqual('Transcript');
		expect(result.t('visitor')).toEqual('Visitor');
		expect(result.t('agent')).toEqual('Agent');
		expect(result.t('date')).toEqual('Date');
		expect(result.t('time')).toEqual('Time');
	});

	it('should throws an error if translation not found', () => {
		const data = { ...validData, translations: translationsData.translations };
		const result = chatTranscript.parseTemplateData(data);
		expect(() => {
			result.t('invalidKey');
		}).toThrow('Translation not found for key: invalidKey');
	});

	it('should parse the system message', () => {
		const data = { ...validData, translations: translationsData.translations };
		const result = chatTranscript.parseTemplateData(data);
		expect(result.messages[2]).toHaveProperty('t', 'livechat-started');
	});
});
