// The building blocks of the add-in, and nothing that runs on its own: the behavior script decides what happens and
// when. Nothing here touches the page, so a workspace that rewrites the HTML is not bound to any element of ours.
// `STRINGS` is handed in by the workspace as it serves this file, worded by its settings.

// Relative, so the page keeps working when the workspace is served under a path.
const API = '../api/v1';

const fetchJson = async (url, options) => {
	const response = await fetch(url, options);
	const body = await response.json().catch(() => ({}));

	if (!response.ok) {
		const error = new Error(body.error || response.statusText);
		error.status = response.status;
		throw error;
	}

	return body;
};

/** Office.js reports through callbacks; this turns one into a promise that rejects on failure. */
const officeAsync = (call) =>
	new Promise((resolve, reject) => {
		call((result) => (result.status === Office.AsyncResultStatus.Succeeded ? resolve(result.value) : reject(result.error)));
	});

const item = () => Office.context.mailbox.item;

const escapeHtml = (value) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** The invitation text as HTML: lines kept, and the meeting link clickable. */
const toHtml = (text, url) => {
	const link = escapeHtml(url);

	return escapeHtml(text).split(link).join(`<a href="${link}">${link}</a>`).replace(/\r?\n/g, '<br>');
};

window.RocketChatAddIn = Object.freeze({
	/** The workspace's wording of every text the add-in shows, by name. */
	strings: Object.freeze({ ...STRINGS }),

	/** Resolves once Office.js can be used; nothing below works before. */
	ready: () => new Promise((resolve) => Office.onReady(() => resolve())),

	getOrganizerEmail: () => Office.context.mailbox.userProfile.emailAddress,

	/** Everyone invited, required and optional alike. */
	getInviteeEmails: async () => {
		const [required, optional] = await Promise.all([
			officeAsync((done) => item().requiredAttendees.getAsync(done)),
			officeAsync((done) => item().optionalAttendees.getAsync(done)),
		]);

		return [...required, ...optional].map(({ emailAddress }) => emailAddress).filter(Boolean);
	},

	getSubject: () => officeAsync((done) => item().subject.getAsync(done)),

	/** `{ canSchedule, canUseSipAlias }` for whoever owns the address. */
	getSchedulingOptions: (email) => fetchJson(`${API}/video-conference.scheduling-options?email=${encodeURIComponent(email)}`),

	/**
	 * Books the meeting, answering `{ url, sipAlias?, text }`. A failure rejects with an error whose `status` is the
	 * HTTP status — 403 when the organizer may not book what was asked for.
	 */
	schedule: ({ email, invitees, sipAlias, title }) =>
		fetchJson(`${API}/video-conference.schedule`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, invitees, sipAlias, ...(title ? { title } : {}) }),
		}),

	/** Adds the text after whatever the organizer has written, so it never splits their own words. */
	appendToBody: async (text, url) => {
		const { body } = item();
		const type = await officeAsync((done) => body.getTypeAsync(done));

		if (type === Office.CoercionType.Html) {
			const html = await officeAsync((done) => body.getAsync(Office.CoercionType.Html, done));
			const block = `<p>${toHtml(text, url)}</p>`;
			const updated = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${block}</body>`) : `${html}${block}`;

			return officeAsync((done) => body.setAsync(updated, { coercionType: Office.CoercionType.Html }, done));
		}

		const plain = await officeAsync((done) => body.getAsync(Office.CoercionType.Text, done));
		const updated = plain.trim() ? `${plain}\n\n${text}` : text;

		return officeAsync((done) => body.setAsync(updated, { coercionType: Office.CoercionType.Text }, done));
	},

	toHtml,
});
