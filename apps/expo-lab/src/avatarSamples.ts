// Markup and image saved from the public server's /avatar endpoints (invented or public data only), plus variants a server could send
export const realUserSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<rect width="100%" height="100%" fill="#10529E"/>
<text x="50%" y="50%" dy="0.36em" text-anchor="middle" pointer-events="none" fill="#ffffff" font-family="'Helvetica', 'Arial', 'Lucida Grande', 'sans-serif'" font-size="125">
R
</text>
</svg>`;

export const realRoomSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<rect width="100%" height="100%" fill="#7F1B9F"/>
<text x="50%" y="50%" dy="0.36em" text-anchor="middle" pointer-events="none" fill="#ffffff" font-family="'Helvetica', 'Arial', 'Lucida Grande', 'sans-serif'" font-size="125">
G
</text>
</svg>`;

const viewBox = ' viewBox="0 0 200 200"';

// A server or proxy that adds an intrinsic size, drops the viewBox, or sizes in percent
export const svgVariants = {
	'width/height 1000': realUserSvg.replace(viewBox, ' width="1000" height="1000"'),
	'viewBox + 1000': realRoomSvg.replace('<svg ', '<svg width="1000" height="1000" '),
	'width/height 100%': realUserSvg.replace('<svg ', '<svg width="100%" height="100%" '),
	'no viewBox': realRoomSvg.replace(viewBox, ''),
} as const;

// 1800x1200 JPEG: an upload far larger than any avatar slot
export const largeImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg';
