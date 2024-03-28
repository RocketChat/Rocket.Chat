/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable prefer-rest-params */
import type Quill from 'quill';
import type { RefObject } from 'react';
import { useRef, useState, useEffect } from 'react';

type QuillOptions = {
	placeholder?: string;
	customIcons?: { [key: string]: string };
};

function assign(target: any, _varArgs: any) {
	if (target === null || target === undefined) {
		throw new TypeError('Cannot convert undefined or null to object');
	}

	const to = Object(target);

	for (let index = 1; index < arguments.length; index++) {
		const nextSource = arguments[index];

		if (nextSource !== null && nextSource !== undefined) {
			for (const nextKey in nextSource) {
				if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
					to[nextKey] = nextSource[nextKey];
				}
			}
		}
	}
	return to;
}

export const useQuill = (options?: QuillOptions) => {
	const quillRef: RefObject<any> = useRef();

	const [isLoaded, setIsLoaded] = useState(false);
	const [obj, setObj] = useState({
		Quill: undefined as any | undefined,
		quillRef,
		quill: undefined as Quill | undefined,
		getDelta: () => {},
	});

	useEffect(() => {
		if (!obj.Quill) {
			setObj((prev) => assign(prev, { Quill: require('quill') }));
		}
		if (obj.Quill && !obj.quill && quillRef && quillRef.current && isLoaded) {
			const opts = {
				modules: { toolbar: '#toolbar' },
				theme: 'snow',
			};
			const quill = new obj.Quill(quillRef.current, opts);
			const getDelta = () => quill.getContents();

			setObj(assign(assign({}, obj), { quill, getDelta }));
		}
		setIsLoaded(true);
	}, [isLoaded, options, obj]);

	return obj;
};
