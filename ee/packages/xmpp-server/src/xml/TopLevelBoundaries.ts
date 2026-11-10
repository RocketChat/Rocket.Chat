const enum State {
	Text,
	TagName,
	Tag,
	AttrName,
	AttrEq,
	AttrQuote,
	AttrValue,
}

/** Finds where the stream header and each top-level element end in a stream that arrives in pieces, so each can be sized on its own. */
export class TopLevelBoundaries {
	private state = State.Text;

	private depth = 0;

	private nameStart = false;

	private endTag = false;

	private selfClosing = false;

	private quote = 0;

	/** Offsets just past each `>` after which no stanza is open: the stream header, each depth-1 element and the stream close. */
	scan(text: string): number[] {
		const ends: number[] = [];

		for (let pos = 0; pos < text.length; pos++) {
			if (this.state === State.Text) {
				pos = text.indexOf('<', pos);
				if (pos === -1) {
					break;
				}
			} else if (this.state === State.AttrValue) {
				const close = text.indexOf(this.quote === 34 ? '"' : "'", pos);
				if (close === -1) {
					break;
				}
				pos = close;
			}

			const c = text.charCodeAt(pos);
			switch (this.state) {
				case State.Text:
					this.state = State.TagName;
					this.nameStart = true;
					this.endTag = false;
					this.selfClosing = false;
					break;
				case State.TagName:
					if (c === 47 /* / */ && this.nameStart) {
						this.endTag = true;
					} else if (c <= 32 || c === 47 || c === 62 /* > */) {
						this.state = State.Tag;
						pos--;
					} else {
						this.nameStart = false;
					}
					break;
				case State.Tag:
					if (c === 62) {
						this.state = State.Text;
						if (this.closeTag()) {
							ends.push(pos + 1);
						}
					} else if (c === 47) {
						this.selfClosing = true;
					} else if (c > 32) {
						this.state = State.AttrName;
					}
					break;
				case State.AttrName:
					if (c <= 32 || c === 61 /* = */) {
						this.state = State.AttrEq;
						pos--;
					}
					break;
				case State.AttrEq:
					if (c === 61) {
						this.state = State.AttrQuote;
					}
					break;
				case State.AttrQuote:
					if (c === 34 || c === 39) {
						this.quote = c;
						this.state = State.AttrValue;
					}
					break;
				case State.AttrValue:
					this.state = State.Tag;
					break;
			}
		}

		return ends;
	}

	private closeTag(): boolean {
		if (this.endTag) {
			this.depth -= 1;
		} else if (!this.selfClosing) {
			this.depth += 1;
		}
		return this.depth <= 1;
	}
}
