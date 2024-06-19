import type { QuillComposerAPI } from '../../../../client/lib/chats/ChatAPI';

const attributesMap = {
	bold: '*',
	italic: '_',
	strike: '~',
};

export const createQuillComposerAPI = (): QuillComposerAPI => {
	let text = '';

	const setQuillDeltaToText = (getDelta: any) => {
		const delta = getDelta();
		delta.ops.forEach((op: any) => {
			const mdStack: string[] = [];
			if (op.attributes) {
				Object.keys(op.attributes).forEach((attribute: string) => {
					mdStack.push(attribute);
					text += attributesMap[attribute as keyof typeof attributesMap];
				});
			}
			text += op.insert;
			while (mdStack.length) {
				text += attributesMap[mdStack.pop() as keyof typeof attributesMap];
			}
		});
	};

	return {
		get text(): string {
			return text;
		},
		setQuillDeltaToText,
	};
};
