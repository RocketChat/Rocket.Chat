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

const setIcons = (obj: any, options: QuillOptions) => {
	const icons = obj.Quill.import('ui/icons');
	const customIcons = options.customIcons || {};

	Object.keys(customIcons).forEach((key) => {
		icons[key] = customIcons[key];
	});
};

export const useQuill = (options: QuillOptions) => {
	const quillRef: RefObject<any> = useRef();

	const [isLoaded, setIsLoaded] = useState(false);
	const [obj, setObj] = useState({
		Quill: undefined as any | undefined,
		quillRef,
		quill: undefined as Quill | undefined,
	});

	useEffect(() => {
		if (!obj.Quill) {
			setObj((prev) => assign(prev, { Quill: require('quill') }));
		}
		if (obj.Quill && !obj.quill && quillRef && quillRef.current && isLoaded) {
			setIcons(obj, options);
			const opts = {
				modules: { toolbar: '#toolbar' },
				placeholder: options.placeholder,
				formats: ['bold', 'italic', 'underline', 'strike', 'list', 'code', 'code-block'],
				theme: 'snow',
			};
			const quill = new obj.Quill(quillRef.current, opts);

			setObj(assign(assign({}, obj), { quill }));
		}
		setIsLoaded(true);
	}, [isLoaded, options, obj]);

	return obj;
};
