import 'ws';

declare module 'ws' {
	namespace Sender {
		function frame(
			data: Buffer,
			options: {
				opcode: number; // The opcode
				readOnly: boolean; // Specifies whether `data` can be modified
				fin: boolean; // Specifies whether or not to set the FIN bit
				mask: boolean; // Specifies whether or not to mask `data`
				rsv1: boolean; // Specifies whether or not to set the RSV1 bit
			},
		): Buffer[];
	}
}
