export function binb2hex(binarray: ArrayLike<number>) {
	const hexTable = '0123456789abcdef';
	let str = '';
	for (let i = 0; i < binarray.length * 4; i++) {
		str +=
			hexTable.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8 + 4)) & 0xf) +
			hexTable.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8)) & 0xf);
	}
	return str;
}
