/* global Office */
'use strict';

// Relative, so the page keeps working when the workspace is served under a path.
const API = '../api/v1';

const strings = {};

const t = (key) => strings[key] || key;

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

/** The workspace's default language, with English filling any key the translation lacks. */
const loadStrings = async () => {
	const { settings = [] } = await fetchJson(`${API}/settings.public?_id=Language`).catch(() => ({}));
	const language = settings.find(({ _id }) => _id === 'Language')?.value || 'en';

	const languages = language === 'en' ? ['en'] : ['en', language];
	for (const lng of languages) {
		Object.assign(strings, await fetchJson(`../i18n/${encodeURIComponent(lng)}.json`).catch(() => ({})));
	}

	document.documentElement.lang = language;
	for (const element of document.querySelectorAll('[data-i18n]')) {
		element.textContent = t(element.dataset.i18n);
	}
};

const elements = {
	status: () => document.getElementById('status'),
	form: () => document.getElementById('form'),
	sipAliasOption: () => document.getElementById('sip-alias-option'),
	sipAlias: () => document.getElementById('sip-alias'),
	confirm: () => document.getElementById('confirm'),
};

const setStatus = (key, tone) => {
	const status = elements.status();
	status.textContent = key ? t(key) : '';
	status.dataset.tone = tone || '';
};

/** Office.js reports through callbacks; this turns one into a promise that rejects on failure. */
const officeAsync = (call) =>
	new Promise((resolve, reject) => {
		call((result) => (result.status === Office.AsyncResultStatus.Succeeded ? resolve(result.value) : reject(result.error)));
	});

const item = () => Office.context.mailbox.item;

const getInviteeEmails = async () => {
	const [required, optional] = await Promise.all([
		officeAsync((done) => item().requiredAttendees.getAsync(done)),
		officeAsync((done) => item().optionalAttendees.getAsync(done)),
	]);

	return [...required, ...optional].map(({ emailAddress }) => emailAddress).filter(Boolean);
};

const escapeHtml = (value) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** The invitation text as HTML: lines kept, and the meeting link clickable. */
const toHtml = (text, url) => {
	const link = escapeHtml(url);

	return escapeHtml(text)
		.split(link)
		.join(`<a href="${link}">${link}</a>`)
		.replace(/\r?\n/g, '<br>');
};

/** Adds the text after whatever the organizer has written, so it never splits their own words. */
const appendToBody = async (text, url) => {
	const body = item().body;
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
};

const schedule = async (event) => {
	event.preventDefault();

	const confirm = elements.confirm();
	confirm.disabled = true;
	setStatus('Outlook_AddIn_Adding');

	try {
		const [invitees, title] = await Promise.all([getInviteeEmails(), officeAsync((done) => item().subject.getAsync(done))]);

		const { url, text } = await fetchJson(`${API}/video-conference.schedule`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: Office.context.mailbox.userProfile.emailAddress,
				invitees,
				sipAlias: !elements.sipAliasOption().hidden && elements.sipAlias().checked,
				...(title ? { title } : {}),
			}),
		});

		await appendToBody(text, url);

		elements.form().hidden = true;
		setStatus('Outlook_AddIn_Added', 'success');
	} catch (error) {
		console.error(error);
		setStatus(error.status === 403 ? 'Outlook_AddIn_Not_Available' : 'Outlook_AddIn_Error', 'error');
		confirm.disabled = false;
	}
};

const start = async () => {
	await loadStrings();
	setStatus('Outlook_AddIn_Loading');

	try {
		const email = Office.context.mailbox.userProfile.emailAddress;
		const options = await fetchJson(`${API}/video-conference.scheduling-options?email=${encodeURIComponent(email)}`);

		if (!options.canSchedule) {
			setStatus('Outlook_AddIn_Not_Available', 'error');
			return;
		}

		elements.sipAliasOption().hidden = !options.canUseSipAlias;
		elements.form().addEventListener('submit', schedule);
		elements.form().hidden = false;
		setStatus('');
	} catch (error) {
		console.error(error);
		setStatus('Outlook_AddIn_Load_Error', 'error');
	}
};

Office.onReady(() => {
	void start();
});
