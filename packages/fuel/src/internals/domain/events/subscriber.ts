import type { DomainEvent } from './event';

export abstract class DomainEventSubscriber {
	public abstract handle<T extends object>(event: DomainEvent<T>): Promise<void>;

	public abstract subscribedTo(): string;
}

export abstract class DomainEventUniversalSubscriber {
	public abstract handle<T extends object>(event: DomainEvent<T>): Promise<void>;
}
