import { WavHeader } from './WavHeader';

const writeFourcc = (view: DataView, offset: number, fourcc: string) => {
	for (let i = 0; i < 4; i++) view.setUint8(offset + i, fourcc.charCodeAt(i));
};

test('readHeader skips the pad byte after an odd-sized chunk', () => {
	const view = new DataView(new ArrayBuffer(12 + 24 + 8 + 4 + 8 + 4));

	writeFourcc(view, 0, 'RIFF');
	view.setUint32(4, view.byteLength - 8, true);
	writeFourcc(view, 8, 'WAVE');

	writeFourcc(view, 12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 2, true);
	view.setUint32(24, 44100, true);
	view.setUint32(28, 44100 * 2 * 2, true);
	view.setUint16(32, 2 * 2, true);
	view.setUint16(34, 16, true);

	writeFourcc(view, 36, 'JUNK');
	view.setUint32(40, 3, true);

	writeFourcc(view, 48, 'data');
	view.setUint32(52, 4, true);

	const header = WavHeader.readHeader(view);

	expect(header).toMatchObject({ dataOffset: 56, dataLen: 4, channels: 2, sampleRate: 44100 });
});
