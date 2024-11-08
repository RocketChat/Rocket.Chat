import { injectable } from '../../dependency-injection';
import type { DomainEvent } from './event';
import type { DomainEventSubscriber } from './subscriber';
import { DomainEventUniversalSubscriber } from './subscriber';

@injectable()
export class DomainEventPublisher {
    private subscribers = new Map<string, DomainEventSubscriber[]>();
    private universalSubscribers: DomainEventUniversalSubscriber[] = [];

    public subscribe(subscriber: DomainEventSubscriber): void {
        const subscribedTo = subscriber.subscribedTo();
        this.subscribers.set(subscribedTo, (this.subscribers.get(subscribedTo) || []).concat(subscriber));
    }

    public subscribeForAllEvents(universalSubscriber: DomainEventUniversalSubscriber): void {
        this.universalSubscribers = (this.universalSubscribers || []).concat(universalSubscriber);
    }

    public clearHandlers(): void {
        this.subscribers.clear();
        this.universalSubscribers = [];
    }

    public dispatch<T extends object>(event: DomainEvent<T>): void {
        this.dispatchForUniversalListeners(event);
        const eventName: string = event.name;
        const subscribers = this.subscribers.get(eventName);
        if (!subscribers || subscribers.length === 0) {
            return;
        }

        for (const subscriber of subscribers) {
            subscriber.handle(event);
        }
    }

    private dispatchForUniversalListeners<T extends object>(event: DomainEvent<T>): void {
        this.universalSubscribers.forEach((subscriber) => subscriber.handle(event));
    }
}
