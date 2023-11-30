/* eslint-disable prefer-rest-params */
import type { QuillOptionsStatic } from 'quill';
import type Quill from 'quill';
import type { RefObject } from 'react';
import { useRef, useState, useEffect } from 'react';

const theme = 'snow';

const modules = {
	toolbar: [
		['bold', 'italic', 'underline', 'strike'],
		[{ align: [] }],

		[{ list: 'ordered' }, { list: 'bullet' }],
		[{ header: [1, 2, 3, 4, 5, 6, false] }],
	],
	clipboard: {
		matchVisual: false,
	},
};

const formats = ['bold', 'italic', 'underline', 'strike', 'align'];

function assign(target: any, _varArgs: any) {
	'use strict';

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

export const useQuill = (options: QuillOptionsStatic | undefined = { modules }) => {
	const quillRef: RefObject<any> = useRef();

	const [isLoaded, setIsLoaded] = useState(false);
	const [obj, setObj] = useState({
		Quill: undefined as any | undefined,
		quillRef,
		quill: undefined as Quill | undefined,
		editorRef: quillRef,
		editor: undefined as Quill | undefined,
	});

	useEffect(() => {
		if (!obj.Quill) {
			setObj((prev) => assign(prev, { Quill: require('quill') }));
		}
		if (obj.Quill && !obj.quill && quillRef && quillRef.current && isLoaded) {
			const opts = assign(options, {
				modules: assign(modules, options.modules),
				formats: options.formats || formats,
				theme: options.theme || theme,
			});
			const quill = new obj.Quill(quillRef.current, opts);

			setObj(assign(assign({}, obj), { quill, editor: quill }));
		}
		setIsLoaded(true);
	}, [isLoaded, obj, options]);

	return obj;
};
