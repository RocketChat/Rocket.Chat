import './style.css';

export const createHexColorPreviewMessageRenderer = () => (message) => {
	if (!message.html?.trim()) {
		return message;
	}

	const regex = /(?:^|\s|\n)(#[A-Fa-f0-9]{3}([A-Fa-f0-9]{3})?)\b/g;

	message.html = message.html.replace(regex, (match, completeColor) =>
		match.replace(
			completeColor,
			`<div class="message-color"><div class="message-color-sample" style="background-color:${completeColor}"></div>${completeColor.toUpperCase()}</div>`,
		),
	);
	return message;
};
