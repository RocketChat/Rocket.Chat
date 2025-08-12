export type Subscribable<T> = {
	get(): T;
	subscribe(callback: () => void): () => void;
};
