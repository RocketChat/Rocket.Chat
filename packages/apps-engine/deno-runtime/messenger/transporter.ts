import { writeAll } from "https://deno.land/std@0.216.0/io/write_all.ts";

export class Transporter {
    private selectedTransport: Transporter['stdoutTransport'] | Transporter['noopTransport'];

    constructor() {
        this.selectedTransport = this.stdoutTransport.bind(this);
    }

    private async stdoutTransport(message: Uint8Array): Promise<void> {
        await writeAll(Deno.stdout, message);
    }

    private async noopTransport(_message: Uint8Array): Promise<void> {}

    public selectTransport(transport: 'stdout' | 'noop'): void {
        switch (transport) {
            case 'stdout':
                this.selectedTransport = this.stdoutTransport.bind(this);
                break;
            case 'noop':
                this.selectedTransport = this.noopTransport.bind(this);
                break;
        }
    }

    public send(message: Uint8Array): Promise<void> {
        return this.selectedTransport(message);
    }
};

export const Transport = new Transporter();
