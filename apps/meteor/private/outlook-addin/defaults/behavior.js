// How the add-in behaves: everything that happens on the page, built on `window.RocketChatAddIn`.
// This is the default for the workspace's "Behavior Script" setting; a workspace may replace it entirely.
(() => {
	const addIn = window.RocketChatAddIn;
	const { strings } = addIn;

	const elements = {
		status: () => document.getElementById('status'),
		form: () => document.getElementById('form'),
		sipAliasOption: () => document.getElementById('sip-alias-option'),
		sipAlias: () => document.getElementById('sip-alias'),
		confirm: () => document.getElementById('confirm'),
	};

	const setStatus = (text, tone) => {
		const status = elements.status();
		status.textContent = text || '';
		status.dataset.tone = tone || '';
	};

	const applyStrings = () => {
		for (const element of document.querySelectorAll('[data-string]')) {
			element.textContent = strings[element.dataset.string] || '';
		}
	};

	const schedule = async (event) => {
		event.preventDefault();

		const confirm = elements.confirm();
		confirm.disabled = true;
		setStatus(strings.adding);

		try {
			const [invitees, title] = await Promise.all([addIn.getInviteeEmails(), addIn.getSubject()]);

			const { url, text } = await addIn.schedule({
				email: addIn.getOrganizerEmail(),
				invitees,
				sipAlias: !elements.sipAliasOption().hidden && elements.sipAlias().checked,
				title,
			});

			await addIn.appendToBody(text, url);

			elements.form().hidden = true;
			setStatus(strings.added, 'success');
		} catch (error) {
			console.error(error);
			setStatus(error.status === 403 ? strings.notAvailable : strings.error, 'error');
			confirm.disabled = false;
		}
	};

	const start = async () => {
		applyStrings();
		setStatus(strings.loading);

		try {
			const options = await addIn.getSchedulingOptions(addIn.getOrganizerEmail());

			if (!options.canSchedule) {
				setStatus(strings.notAvailable, 'error');
				return;
			}

			elements.sipAliasOption().hidden = !options.canUseSipAlias;
			elements.form().addEventListener('submit', schedule);
			elements.form().hidden = false;
			setStatus('');
		} catch (error) {
			console.error(error);
			setStatus(strings.unreachable, 'error');
		}
	};

	void addIn.ready().then(start);
})();
