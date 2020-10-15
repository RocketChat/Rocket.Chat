/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import 'ws';

type FrameOptions = {
	opcode: number; // The opcode
	readOnly: boolean; // Specifies whether `data` can be modified
	fin: boolean; // Specifies whether or not to set the FIN bit
	mask: boolean; // Specifies whether or not to mask `data`
	rsv1: boolean; // Specifies whether or not to set the RSV1 bit
}

declare module 'ws' {
	class Sender {
		static frame(data: Buffer, options: FrameOptions): Buffer[];
	}
}
