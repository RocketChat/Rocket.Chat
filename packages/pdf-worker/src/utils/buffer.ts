function makeid(length: number): string {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}

// Fixes https://github.com/diegomura/react-pdf/issues/1805 on our side.
// There's a PR for fixing this, but there's no available release yet.
// Issue is: react-pdf holds a cache of images for reusing, but it uses either data.toString or data.uri as the key.
// Since Buffer doesnt have those properties, it's always undefined, and so subsequent buffers are ignored since they have all the same key
// Since we're using buffer images and the code in react-pdf doesnt use the toString method, this should work fine.
// Assigning URI to a random string should bypass that cache and allow us to use the different buffer images
export function wrapBuffer(buf: Buffer): Buffer {
	// @ts-expect-error - uri is not on buffer
	buf.uri = makeid(10);
	return buf;
}
