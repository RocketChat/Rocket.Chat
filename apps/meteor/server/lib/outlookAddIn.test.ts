import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

const settingValues: Record<string, unknown> = {};

const { getOutlookAddInFrameOrigins } = proxyquire.noCallThru().load('./outlookAddIn', {
	'../settings': { settings: { get: (key: string) => settingValues[key] } },
});

describe('getOutlookAddInFrameOrigins', () => {
	// Admins paste lists however they like; both separators the description mentions have to work.
	it('should split on spaces, commas and line breaks', () => {
		settingValues.Pexip_Integration_Outlook_AddIn_Frame_Origins = 'https://a.example.com, https://b.example.com\nhttps://c.example.com';

		expect(getOutlookAddInFrameOrigins()).to.deep.equal(['https://a.example.com', 'https://b.example.com', 'https://c.example.com']);
	});

	// Nothing configured must mean "nobody may frame it", never an empty `frame-ancestors` that some browsers ignore.
	it('should name no origin while the setting is empty', () => {
		settingValues.Pexip_Integration_Outlook_AddIn_Frame_Origins = '  ';

		expect(getOutlookAddInFrameOrigins()).to.deep.equal([]);
	});
});
