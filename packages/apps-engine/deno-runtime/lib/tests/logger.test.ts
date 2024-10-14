import { assertEquals } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { Logger } from "../logger.ts";

describe('Logger', () => {
    it('getLogs should return an array of entries', () => {
        const logger = new Logger('test');
        logger.info('test');
        const logs = logger.getLogs();
        assertEquals(logs.entries.length, 1);
        assertEquals(logs.method, 'test');
    })

    it('should be able to add entries of different severity', () => {
        const logger = new Logger('test');
        logger.info('test');
        logger.debug('test');
        logger.error('test');
        const logs = logger.getLogs();
        assertEquals(logs.entries.length, 3);
        assertEquals(logs.entries[0].severity, 'info');
        assertEquals(logs.entries[1].severity, 'debug');
        assertEquals(logs.entries[2].severity, 'error');
    })

    it('should be able to add an info entry', () => {
        const logger = new Logger('test');
        logger.info('test');
        const logs = logger.getLogs();
        assertEquals(logs.entries.length, 1);
        assertEquals(logs.entries[0].args[0], 'test');
        assertEquals(logs.entries[0].method, 'test');
        assertEquals(logs.entries[0].severity, 'info');
    });

    it('should be able to add an debug entry', () => {
        const logger = new Logger('test');
        logger.debug('test');
        const logs = logger.getLogs();
        assertEquals(logs.entries.length, 1);
        assertEquals(logs.entries[0].args[0], 'test');
        assertEquals(logs.entries[0].method, 'test');
        assertEquals(logs.entries[0].severity, 'debug');
    });

    it('should be able to add an error entry', () => {
        const logger = new Logger('test');
        logger.error('test');
        const logs = logger.getLogs();
        assertEquals(logs.entries.length, 1);
        assertEquals(logs.entries[0].args[0], 'test');
        assertEquals(logs.entries[0].method, 'test');
        assertEquals(logs.entries[0].severity, 'error');
    });

    it('should be able to add an success entry', () => {
        const logger = new Logger('test');
        logger.success('test');
        const logs = logger.getLogs();
        assertEquals(logs.entries.length, 1);
        assertEquals(logs.entries[0].args[0], 'test');
        assertEquals(logs.entries[0].method, 'test');
        assertEquals(logs.entries[0].severity, 'success');
    });

    it('should be able to add an warning entry', () => {
        const logger = new Logger('test');
        logger.warn('test');
        const logs = logger.getLogs();
        assertEquals(logs.entries.length, 1);
        assertEquals(logs.entries[0].args[0], 'test');
        assertEquals(logs.entries[0].method, 'test');
        assertEquals(logs.entries[0].severity, 'warning');
    });

    it('should be able to add an log entry', () => {
        const logger = new Logger('test');
        logger.log('test');
        const logs = logger.getLogs();
        assertEquals(logs.entries.length, 1);
        assertEquals(logs.entries[0].args[0], 'test');
        assertEquals(logs.entries[0].method, 'test');
        assertEquals(logs.entries[0].severity, 'log');
    });

    it('should be able to add an entry with multiple arguments', () => {
        const logger = new Logger('test');
        logger.log('test', 'test', 'test');
        const logs = logger.getLogs();
        assertEquals(logs.entries.length, 1);
        assertEquals(logs.entries[0].args[0], 'test');
        assertEquals(logs.entries[0].args[1], 'test');
        assertEquals(logs.entries[0].args[2], 'test');
        assertEquals(logs.entries[0].method, 'test');
        assertEquals(logs.entries[0].severity, 'log');
    });

    it('should be able to add an entry with multiple arguments of different types', () => {
        const logger = new Logger('test');
        logger.log('test', 1, true, { foo: 'bar' });
        const logs = logger.getLogs();
        assertEquals(logs.entries.length, 1);
        assertEquals(logs.entries[0].args[0], 'test');
        assertEquals(logs.entries[0].args[1], 1);
        assertEquals(logs.entries[0].args[2], true);
        assertEquals(logs.entries[0].args[3], { foo: 'bar' });
        assertEquals(logs.entries[0].method, 'test');
        assertEquals(logs.entries[0].severity, 'log');
    });

})
