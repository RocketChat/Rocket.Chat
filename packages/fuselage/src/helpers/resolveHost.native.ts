import type { ElementType } from 'react';
import { Image, Text, TextInput, View } from 'react-native';

const textTags = new Set([
	'span',
	'p',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'label',
	'legend',
	'strong',
	'em',
	'small',
	'b',
	'i',
	'u',
	's',
	'a',
	'code',
	'pre',
	'time',
	'dt',
	'dd',
	'figcaption',
	'mark',
	'sub',
	'sup',
	'q',
	'cite',
	'abbr',
	'kbd',
	'samp',
	'var',
	'del',
	'ins',
]);

const inputTags = new Set(['input', 'textarea']);

/** The React Native host component a tag name stands for; anything that is not a tag name is returned as it is. */
export const resolveHost = (is: ElementType): ElementType => {
	if (typeof is !== 'string') {
		return is;
	}
	if (textTags.has(is)) {
		return Text;
	}
	if (inputTags.has(is)) {
		return TextInput;
	}
	if (is === 'img') {
		return Image;
	}
	return View;
};

/** The React Native host component for text, whatever tag name the text asks for. */
export const resolveTextHost = (is: ElementType): ElementType => (typeof is === 'string' ? Text : is);
