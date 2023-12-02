const elementTagMaps = {
	strong: '*',
	em: '_',
	s: '~',
	li: '- ',
	pre: '```',
	code: '`',
	p: '\n',
	br: '',
	span: '',
};

const makeListMarkDown = (element: HTMLElement) => {
	let text = '';
	for (let i = 0; i < element.childNodes.length - 1; i++) {
		const child = element.childNodes[i];
		if (element.nodeName.toLowerCase() === 'ol') {
			text += `${i + 1}. `;
		} else {
			const mdSymbol = elementTagMaps[child.nodeName.toLowerCase() as keyof typeof elementTagMaps] || '';
			text += mdSymbol;
		}
		text += parseMarkdown(child as HTMLElement);
		text += '\n';
	}
	return text;
};

const makeCodeBlockMarkDown = (element: HTMLElement) => {
	let text = `${elementTagMaps.pre}\n`;
	text += parseMarkdown(element as HTMLElement);
	text += elementTagMaps.pre;
	return text;
};

const parseMarkdown = (element: HTMLElement) => {
	let text = '';
	for (const child of element.childNodes) {
		if (child.nodeType === Node.TEXT_NODE) {
			text += child.textContent || '';
		} else if (child.nodeType === Node.ELEMENT_NODE) {
			if (child.nodeName.toLowerCase() === 'ul' || child.nodeName.toLowerCase() === 'ol') {
				text += makeListMarkDown(child as HTMLElement);
				continue;
			} else if (child.nodeName.toLowerCase() === 'pre') {
				text += makeCodeBlockMarkDown(child as HTMLElement);
				continue;
			}
			const mdSymbol = elementTagMaps[child.nodeName.toLowerCase() as keyof typeof elementTagMaps] || '';
			text += mdSymbol;
			text += parseMarkdown(child as HTMLElement);
			if (child.nodeName.toLowerCase() !== 'p') text += mdSymbol;
		}
	}
	return text;
};

const buildMarkdown = (element: HTMLElement) => {
	return parseMarkdown(element.childNodes[0] as HTMLElement);
};

export default buildMarkdown;
