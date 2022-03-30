export const createIssueLinksMessageRenderer =
	({ template }) =>
	(message) => {
		if (!message.html?.trim()) {
			return message;
		}

		message.html = message.html.replace(/(?:^|\s|\n)(#[0-9]+)\b/g, (match, issueNumber) => {
			const url = template.replace('%s', issueNumber.substring(1));
			return match.replace(issueNumber, `<a href="${url}" target="_blank">${issueNumber}</a>`);
		});

		return message;
	};
