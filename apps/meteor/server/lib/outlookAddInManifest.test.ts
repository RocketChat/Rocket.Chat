import { describe, it } from 'node:test';

import { expect } from 'chai';

import { buildOutlookAddInManifest } from './outlookAddInManifest';

const strings = {
	name: 'Rocket.Chat Meetings',
	description: 'Add meetings',
	group: 'Rocket.Chat',
	button: 'Add Rocket.Chat Meeting',
	buttonDescription: 'Add a meeting',
};

const build = (overrides: Partial<Parameters<typeof buildOutlookAddInManifest>[0]> = {}) =>
	buildOutlookAddInManifest({ id: '0b8f3d2e-1111-4222-8333-944455556666', siteUrl: 'https://chat.example.com/', strings, ...overrides });

describe('buildOutlookAddInManifest', () => {
	it('should point the button at the task pane on this workspace', () => {
		expect(build()).to.include('<bt:Url id="TaskpaneUrl" DefaultValue="https://chat.example.com/outlook-addin/taskpane.html"/>');
	});

	// A workspace served under a path still has its add-in under that path, but its domain is only the origin.
	it('should keep a workspace path in the URLs and leave it out of the app domain', () => {
		const manifest = build({ siteUrl: 'https://example.com/chat' });

		expect(manifest).to.include('DefaultValue="https://example.com/chat/outlook-addin/taskpane.html"');
		expect(manifest).to.include('<AppDomain>https://example.com</AppDomain>');
	});

	it('should carry the workspace id', () => {
		expect(build()).to.include('<Id>0b8f3d2e-1111-4222-8333-944455556666</Id>');
	});

	// Translations are free text; one stray character would make Exchange reject the whole manifest.
	it('should escape the strings it is given', () => {
		const manifest = build({ strings: { ...strings, name: 'Meetings & "Calls" <beta>' } });

		expect(manifest).to.include('<DisplayName DefaultValue="Meetings &amp; &quot;Calls&quot; &lt;beta&gt;"/>');
	});

	// Add-in commands arrived in Mailbox 1.3, the newest set every supported on-premises Exchange has.
	it('should put the button on the meeting organizer form and ask for Mailbox 1.3', () => {
		const manifest = build();

		expect(manifest).to.include('<ExtensionPoint xsi:type="AppointmentOrganizerCommandSurface">');
		expect(manifest).to.include('<bt:Sets DefaultMinVersion="1.3">');
	});
});
