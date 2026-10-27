import { act, renderHook } from './testing';
import { useElementIsVisible } from './useElementIsVisible';

class IntersectionObserverMock {
	static instances: IntersectionObserverMock[] = [];

	readonly observed = new Set<Element>();

	constructor() {
		IntersectionObserverMock.instances.push(this);
	}

	observe(element: Element) {
		this.observed.add(element);
	}

	unobserve(element: Element) {
		this.observed.delete(element);
	}

	disconnect() {
		this.observed.clear();
	}
}

const isObserved = (element: Element) => IntersectionObserverMock.instances.some(({ observed }) => observed.has(element));

beforeAll(() => {
	Object.assign(window, { IntersectionObserver: IntersectionObserverMock });
});

afterEach(() => {
	IntersectionObserverMock.instances = [];
});

const renderRef = () => {
	const { result } = renderHook(() => useElementIsVisible<HTMLDivElement>());
	return result.current[0] as unknown as (node: HTMLDivElement | null) => void;
};

it('observes the element passed to the ref', () => {
	const ref = renderRef();
	const element = document.createElement('div');

	act(() => ref(element));

	expect(isObserved(element)).toBe(true);
});

it('stops observing the previous element when the ref receives another one', () => {
	const ref = renderRef();
	const previous = document.createElement('div');
	const next = document.createElement('div');

	act(() => ref(previous));
	act(() => ref(next));

	expect(isObserved(previous)).toBe(false);
	expect(isObserved(next)).toBe(true);
});

it('stops observing the element when the ref is detached', () => {
	const ref = renderRef();
	const element = document.createElement('div');

	act(() => ref(element));
	act(() => ref(null));

	expect(isObserved(element)).toBe(false);
});
