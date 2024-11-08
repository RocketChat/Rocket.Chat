import { PublishableEvent } from "../../communication";

export abstract class DomainEvent<T extends object> extends PublishableEvent<T> {
    public abstract name: string;

    public occurredOn: Date;

    constructor(occurredOn?: Date) {
        super();
        this.occurredOn = occurredOn || new Date();
    }
}
