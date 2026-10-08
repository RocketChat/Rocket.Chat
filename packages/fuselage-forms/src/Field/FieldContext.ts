import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, RefCallback } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

export type FieldContextValue = {
	setDescriptor: (type: LabelTypes, unregister?: boolean) => void;
	setLabel: (label: ReactNode) => void;
	descriptors: Set<LabelTypes>;
	label: ReactNode | null;
	id: string;
	fieldType: FieldType;
	setFieldType: (fieldType: FieldType) => void;
	emitAction: () => void;
	onAction: (cb: () => void) => () => void;
};

export const FieldContext = createContext<FieldContextValue>({
	setDescriptor: () => undefined,
	setLabel: () => undefined,
	descriptors: new Set(),
	label: null,
	id: '',
	fieldType: 'referencedByLabel',
	setFieldType: () => undefined,
	emitAction: () => undefined,
	onAction: () => () => undefined,
});

export type LabelTypes = 'hint' | 'description' | 'error' | 'placeholder';

export type FieldType = 'wrappedByLabel' | 'referencedByLabel' | 'referencedByInput';

const getTextFromNode = (node: HTMLElement) => {
	if (!node.textContent) {
		return null;
	}

	const text = [];
	const treeWalker = node.ownerDocument.createTreeWalker(node, NodeFilter.SHOW_TEXT);

	while (treeWalker.nextNode()) {
		text.push(treeWalker.currentNode.textContent);
	}

	return text.join(' ');
};

export const useFieldLabel = (): [RefCallback<HTMLElement>, string] => {
	const { setLabel, id, emitAction } = useContext(FieldContext);

	const setLabelRef = useSafeRefCallback(
		useCallback(
			(node: HTMLElement) => {
				if (!node) {
					return;
				}
				setLabel(getTextFromNode(node));

				const onClick = () => emitAction();

				node.addEventListener('click', onClick);

				return () => node.removeEventListener('click', onClick);
			},
			[setLabel, emitAction],
		),
	);

	return [setLabelRef, `${id}-label`];
};

export const useFieldFieldType = () => {
	const { fieldType } = useContext(FieldContext);
	return fieldType;
};

export const useFieldDescriptorId = (type: LabelTypes) => {
	const { setDescriptor, id } = useContext(FieldContext);

	useEffect(() => {
		setDescriptor(type);
		return () => setDescriptor(type, true);
	}, [type, setDescriptor]);

	return `${id}-${type}`;
};

const describedByOrder = ['description', 'error', 'hint'] as const;
const getDescribedBy = (descriptors: Set<LabelTypes>, id: string) => {
	return describedByOrder
		.map((type) => {
			return descriptors.has(type) ? `${id}-${type}` : undefined;
		})
		.filter(Boolean)
		.join(' ');
};

const getInputId = (id: string, descriptors: Set<LabelTypes>) => {
	return `${id}-label${descriptors.has('placeholder') ? ` ${id}-placeholder` : ''}`;
};

const getAriaInvalid = (descriptors: Set<LabelTypes>): { 'aria-invalid': 'true' | 'false' } => {
	if (descriptors.has('error')) {
		return { 'aria-invalid': 'true' };
	}
	return { 'aria-invalid': 'false' };
};

// Input has id and label is htmlFor
export const useFieldReferencedByInput = () => {
	const { id, descriptors, setFieldType } = useContext(FieldContext);

	useEffect(() => {
		setFieldType('referencedByInput');
	}, [setFieldType]);

	return useMemo(
		() => ({
			'id': getInputId(id, descriptors),
			'aria-describedby': getDescribedBy(descriptors, id),
			...getAriaInvalid(descriptors),
		}),
		[descriptors, id],
	);
};

// label has id and input is aria-labelledby
export const useFieldReferencedByLabel = () => {
	const { id, descriptors, setFieldType } = useContext(FieldContext);

	useEffect(() => {
		setFieldType('referencedByLabel');
	}, [setFieldType]);

	return useMemo(
		() => ({
			'aria-labelledby': getInputId(id, descriptors),
			'aria-describedby': getDescribedBy(descriptors, id),
			...getAriaInvalid(descriptors),
		}),
		[descriptors, id],
	);
};

// label has id and input is aria-labelledby + has id for aria-controls
export const useFieldReferencedByLabelWithId = () => {
	const { id, descriptors, setFieldType } = useContext(FieldContext);

	useEffect(() => {
		setFieldType('referencedByLabel');
	}, [setFieldType]);

	return useMemo(
		() => ({
			id,
			'aria-labelledby': getInputId(id, descriptors),
			'aria-describedby': getDescribedBy(descriptors, id),
			...getAriaInvalid(descriptors),
		}),
		[descriptors, id],
	);
};

// label is rendered visually hidden inside the inputs wrapper label
export const useFieldWrappedByInputLabel = (): [
	ReactNode,
	{
		'aria-describedby': string;
		'id': string;
		'aria-invalid': 'true' | 'false';
	},
	RefCallback<HTMLElement>,
] => {
	const { id, label, descriptors, setFieldType, onAction } = useContext(FieldContext);

	useEffect(() => {
		setFieldType('wrappedByLabel');
	}, [setFieldType]);

	const refCallback = useSafeRefCallback(
		useCallback(
			(node: HTMLElement) => {
				if (!node) {
					return;
				}

				return onAction(() => {
					node.focus();
					node.click();
				});
			},
			[onAction],
		),
	);

	return useMemo(
		() => [
			label,
			{
				'aria-describedby': getDescribedBy(descriptors, id),
				'id': getInputId(id, descriptors),
				...getAriaInvalid(descriptors),
			},
			refCallback,
		],
		[label, descriptors, id, refCallback],
	);
};
