import JoyPixels from 'JoyPixels';

export function JoyPixelsRender(message: string): string {
	return JoyPixels.toImage(message);
}

export function JoyPixelsRenderFromShort(message: string): string {
	return JoyPixels.shortnameToImage(message);
}
