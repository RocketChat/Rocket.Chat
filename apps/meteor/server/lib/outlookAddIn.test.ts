import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

const settingValues: Record<string, unknown> = {};

const { getOutlookAddInFrameOrigins, getOutlookAddInManifestStrings, getOutlookAddInPaneStrings } = proxyquire
	.noCallThru()
	.load('./outlookAddIn', {
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

describe('getOutlookAddInPaneStrings', () => {
	it('should use what the workspace set', () => {
		settingValues.Pexip_Integration_Outlook_AddIn_String_Confirm = 'Termin hinzufügen';

		expect(getOutlookAddInPaneStrings().confirm).to.equal('Termin hinzufügen');
	});

	// A cleared string would otherwise leave a button with no label.
	it('should fall back to the default for a string the admin cleared', () => {
		settingValues.Pexip_Integration_Outlook_AddIn_String_Confirm = '';

		expect(getOutlookAddInPaneStrings().confirm).to.equal('Add meeting');
	});

	it('should hand out every string the pane uses', () => {
		expect(Object.keys(getOutlookAddInPaneStrings())).to.have.members([
			'loading',
			'unreachable',
			'intro',
			'addSipAlias',
			'confirm',
			'adding',
			'added',
			'error',
			'notAvailable',
		]);
	});
});

describe('getOutlookAddInManifestStrings', () => {
	it('should read the manifest texts from their own settings', () => {
		settingValues.Pexip_Integration_Outlook_AddIn_String_Button = 'Besprechung';

		expect(getOutlookAddInManifestStrings()).to.include({ button: 'Besprechung', name: 'Rocket.Chat Meetings' });
	});
});
