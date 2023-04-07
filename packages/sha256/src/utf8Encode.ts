export function utf8Encode(input: string) {
	// METEOR change:
	// The webtoolkit.info version of this code added this
	// Utf8Encode function (which does seem necessary for dealing
	// with arbitrary Unicode), but the following line seems
	// problematic:
	//
	// string = string.replace(/\r\n/g,"\n");
	let utftext = '';

	for (let n = 0; n < input.length; n++) {
		const c = input.charCodeAt(n);

		if (c < 128) {
			utftext += String.fromCharCode(c);
		} else if (c > 127 && c < 2048) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		} else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}
	}

	return utftext;
}
