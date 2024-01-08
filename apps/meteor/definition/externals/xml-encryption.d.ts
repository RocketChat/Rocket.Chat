import 'xml-encryption';

declare module 'xml-encryption' {
	export function decrypt(xml: Element, options: DecryptOptions, callback: (err: Error, result: any) => void): string;
}
