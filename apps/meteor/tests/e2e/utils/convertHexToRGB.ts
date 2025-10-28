export const convertHexToRGB = (hex: string) => {
	hex = hex.replace(/^#/, '');

	const red = parseInt(hex.substring(0, 2), 16);
	const green = parseInt(hex.substring(2, 4), 16);
	const blue = parseInt(hex.substring(4, 6), 16);

	return `rgb(${red}, ${green}, ${blue})`;
};
