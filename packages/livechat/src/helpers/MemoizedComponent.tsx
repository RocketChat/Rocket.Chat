import type { RenderableProps } from 'preact';
import { Component } from 'preact';

export abstract class MemoizedComponent<P extends Record<string, unknown>, S> extends Component<P, S> {
	shouldComponentUpdate(nextProps: RenderableProps<P>) {
		const { props } = this;

		for (const key in props) {
			if (props[key] !== nextProps[key]) {
				return true;
			}
		}

		for (const key in nextProps) {
			if (!(key in props)) {
				return true;
			}
		}

		return false;
	}
}
