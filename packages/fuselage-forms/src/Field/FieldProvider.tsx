import { Emitter } from '@rocket.chat/emitter';
import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { useId } from 'react-aria';

import type { LabelTypes, FieldType } from './FieldContext';
import { FieldContext } from './FieldContext';

export type FieldProviderProps = { children: ReactNode };

function FieldProvider({ children }: FieldProviderProps) {
	const id = useId();
	const [label, setLabel] = useState<ReactNode | null>(null);
	const [descriptors, setDescriptors] = useState(new Set<LabelTypes>());
	const [fieldType, setFieldType] = useState<FieldType>('referencedByInput');
	const [emitter] = useState(() => new Emitter<{ action: void }>());

	const setDescriptor = useCallback((type: LabelTypes, unregister?: boolean) => {
		setDescriptors((labels) => {
			const _labelMap = new Set(labels);

			if (unregister) {
				_labelMap.delete(type);
				return _labelMap;
			}

			_labelMap.add(type);
			return _labelMap;
		});
	}, []);

	const emitAction = useCallback(() => {
		emitter.emit('action');
	}, [emitter]);

	const onAction = useCallback(
		(cb: () => void) => {
			return emitter.on('action', cb);
		},
		[emitter],
	);

	return (
		<FieldContext.Provider
			value={{
				emitAction,
				onAction,
				setDescriptor,
				setLabel,
				descriptors,
				label,
				id,
				fieldType,
				setFieldType,
			}}
		>
			{children}
		</FieldContext.Provider>
	);
}

export default FieldProvider;
