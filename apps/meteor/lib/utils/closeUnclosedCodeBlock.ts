export const closeUnclosedCodeBlock = (text: string): string => {
	const backtickCount = (text.match(/```/g) || []).length;
	if (backtickCount % 2 !== 0) {
		return `${text}\n\`\`\``;
	}
	return text;
};
