/* Content tags defined by RFC 4796 - external SDPs may still have other values */
type MediaContent = 'slides' | 'speaker' | 'sl' | 'main' | 'alt';
type StreamContent = { id: string; content: MediaContent };

const lineDelimiter = '\r\n';

class MediaDescription {
	private _lines: string[];

	public readonly streamIds: string[];

	private _type: string | null = null;

	private _content: string | null = null;

	public get type(): string | null {
		return this._type;
	}

	public get content(): string | null {
		return this._content;
	}

	public get lines(): string[] {
		return this._lines;
	}

	constructor(lines: string[]) {
		this._lines = [...lines];
		this.streamIds = [];
		this.parseLines();
		this.loadStreamIds();
	}

	private loadStreamIds() {
		for (const line of this.lines) {
			if (!line.startsWith('a=msid:')) {
				continue;
			}

			const streamId = line.slice('a=msid:'.length).split(' ')[0];
			if (!streamId || streamId === '-') {
				continue;
			}

			if (this.streamIds.includes(streamId)) {
				continue;
			}

			this.streamIds.push(streamId);
		}
	}

	private parseLines() {
		for (const line of this.lines) {
			this.parseMediaType(line);
			this.parseStreamId(line);
			this.parseContent(line);
		}
	}

	private parseMediaType(line: string) {
		if (this._type || !line.startsWith('m=')) {
			return;
		}

		this._type = line.match(/^m=(\w+)/)?.[1] || null;
	}

	private parseStreamId(line: string) {
		if (!line.startsWith('a=msid:')) {
			return;
		}

		const streamId = line.slice('a=msid:'.length).split(' ')[0];
		if (!streamId || streamId === '-') {
			return;
		}

		if (this.streamIds.includes(streamId)) {
			return;
		}

		this.streamIds.push(streamId);
	}

	private parseContent(line: string) {
		if (!line.startsWith('a=content:')) {
			return;
		}

		this._content = line.replace('a=content:', '') || null;
	}

	public setContent(value: MediaContent | null) {
		if (this._content === value) {
			return;
		}

		this._content = value || null;
		const lines = this.lines.filter((line) => !line.startsWith('a=content:'));
		this._lines = [...lines, ...(value ? [`a=content:${value}`] : [])];
	}
}

export class SDP {
	private headerLines: string[];

	public readonly medias: MediaDescription[];

	constructor(sdp: string) {
		this.headerLines = [];
		this.medias = [];

		this.parseSDP(sdp);
	}

	private addMediaDescription(lines?: string[]) {
		if (!lines?.length) {
			return;
		}

		this.medias.push(new MediaDescription(lines));
	}

	private parseSDP(sdp: string) {
		const allLines = sdp.split(/\r?\n/);

		let currentMediaLines: string[] | undefined;

		for (const line of allLines) {
			if (line.startsWith('m=')) {
				this.addMediaDescription(currentMediaLines);

				currentMediaLines = [line];
				continue;
			}

			if (!currentMediaLines) {
				this.headerLines.push(line);
				continue;
			}

			currentMediaLines.push(line);
		}

		this.addMediaDescription(currentMediaLines);
	}

	public joinLines(): string {
		const lines = [...this.headerLines, ...this.medias.flatMap(({ lines }) => lines)];

		const delimitedLines = lines.map((line) => {
			if (!line) {
				return line;
			}

			return `${line}${lineDelimiter}`;
		});

		return delimitedLines.join('');
	}

	public setContentMediaByStreamId(streamId: string, content: MediaContent) {
		for (const media of this.medias) {
			if (media.streamIds.includes(streamId)) {
				media.setContent(content);
			}
		}
	}

	public static mutateSDPWithStreamContents(sdp: string, streams: StreamContent[]): string {
		if (!streams.length) {
			return sdp;
		}

		const parsed = new SDP(sdp);

		for (const { id, content } of streams) {
			parsed.setContentMediaByStreamId(id, content);
		}

		return parsed.joinLines();
	}

	/*
	 * Returns an object where the key is a stream id and the object is a stream content tag
	 */
	public static getStreamContentMapFromSDP(sdp: string): Record<string, string> {
		const streams: Record<string, string> = {};

		const parsed = new SDP(sdp);
		for (const media of parsed.medias) {
			const { streamIds, content } = media;
			if (!streamIds.length || !content) {
				continue;
			}

			for (const id of streamIds) {
				streams[id] = content;
			}
		}

		return streams;
	}
}
