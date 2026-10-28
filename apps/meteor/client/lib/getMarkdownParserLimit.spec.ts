import { getMarkdownParserLimit } from './getMarkdownParserLimit';
import { getPageMeta } from './getPageMeta';

jest.mock('./getPageMeta');

const getPageMetaMock = jest.mocked(getPageMeta);

let mockDefaultLimit = 0;

jest.mock('../../lib/constants', () => ({
	get MESSAGE_MAX_PARSE_LENGTH_DEFAULT() {
		return mockDefaultLimit;
	},
}));

describe('getMarkdownParserLimit', () => {
	beforeEach(() => {
		getPageMetaMock.mockClear();
		mockDefaultLimit = 0;
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should return Infinity when meta tag is null and default constant is 0', () => {
		getPageMetaMock.mockReturnValue(null);
		mockDefaultLimit = 0;

		expect(getMarkdownParserLimit()).toBe(Infinity);
	});

	it('should return the default constant when meta tag is null and constant > 0', () => {
		getPageMetaMock.mockReturnValue(null);
		mockDefaultLimit = 5000;

		expect(getMarkdownParserLimit()).toBe(5000);
	});

	it('should return the parsed meta value when it is a valid positive number', () => {
		getPageMetaMock.mockReturnValue('10000');
		mockDefaultLimit = 0;

		expect(getMarkdownParserLimit()).toBe(10000);
	});

	it('should return Infinity when meta value is "0"', () => {
		getPageMetaMock.mockReturnValue('0');
		mockDefaultLimit = 0;

		expect(getMarkdownParserLimit()).toBe(Infinity);
	});

	it('should return Infinity when meta value is a negative number', () => {
		getPageMetaMock.mockReturnValue('-5');
		mockDefaultLimit = 0;

		expect(getMarkdownParserLimit()).toBe(Infinity);
	});

	it('should return defaultValue when meta value is not a finite number (NaN)', () => {
		getPageMetaMock.mockReturnValue('abc');
		mockDefaultLimit = 0;

		expect(getMarkdownParserLimit()).toBe(Infinity);
	});
});
