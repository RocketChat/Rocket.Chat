import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { TEXT_INDEX_FIELDS, classifyTextIndex } from '../../../../server/startup/ensureMessagesTextIndex';

describe('ensureMessagesTextIndex', () => {
	const validWeights = {
		'msg': 1,
		'attachments.description': 1,
		'attachments.title': 1,
		'attachments.text': 1,
		'attachments.pretext': 1,
		'attachments.author_name': 1,
		'attachments.fields.title': 1,
		'attachments.fields.value': 1,
	};

	describe('classifyTextIndex', () => {
		it('should classify default text index with attachment fields as default', () => {
			const shape = classifyTextIndex({
				key: { _fts: 'text', _ftsx: 1 },
				weights: validWeights,
			});
			expect(shape).to.equal('default');
		});

		it('should classify room-scoped text index with attachment fields as room-scoped', () => {
			const shape = classifyTextIndex({
				key: { rid: 1, _fts: 'text', _ftsx: 1 },
				weights: validWeights,
			});
			expect(shape).to.equal('room-scoped');
		});

		it('should classify legacy msg-only default text index as other (stale)', () => {
			const shape = classifyTextIndex({
				key: { _fts: 'text', _ftsx: 1 },
				weights: { msg: 1 },
			});
			expect(shape).to.equal('other');
		});

		it('should classify legacy msg-only room-scoped text index as other (stale)', () => {
			const shape = classifyTextIndex({
				key: { rid: 1, _fts: 'text', _ftsx: 1 },
				weights: { msg: 1 },
			});
			expect(shape).to.equal('other');
		});

		it('should classify index with missing weights as other', () => {
			const shape = classifyTextIndex({
				key: { _fts: 'text', _ftsx: 1 },
			});
			expect(shape).to.equal('other');
		});

		it('should classify index with extra text weight fields as other', () => {
			const shape = classifyTextIndex({
				key: { _fts: 'text', _ftsx: 1 },
				weights: { ...validWeights, extraField: 1 },
			});
			expect(shape).to.equal('other');
		});

		it('should classify index with weight !== 1 as other', () => {
			const shape = classifyTextIndex({
				key: { _fts: 'text', _ftsx: 1 },
				weights: { ...validWeights, msg: 2 },
			});
			expect(shape).to.equal('other');
		});

		it('should classify index with non-matching key prefix as other', () => {
			const shape = classifyTextIndex({
				key: { uid: 1, _fts: 'text', _ftsx: 1 },
				weights: validWeights,
			});
			expect(shape).to.equal('other');
		});
	});

	describe('ensureMessagesTextIndex function', () => {
		const models = {
			Messages: {
				col: {
					indexes: sinon.stub(),
					dropIndex: sinon.stub(),
					createIndex: sinon.stub(),
				},
			},
		};

		const systemLogger = {
			SystemLogger: {
				debug: sinon.stub(),
				startup: sinon.stub(),
				error: sinon.stub(),
			},
		};

		const loadEnsureMessagesTextIndex = (env: Record<string, string | undefined> = {}) => {
			const originalEnv = { ...process.env };
			Object.assign(process.env, env);

			const { ensureMessagesTextIndex: fn } = proxyquire.noCallThru().load('../../../../server/startup/ensureMessagesTextIndex', {
				'@rocket.chat/models': models,
				'../lib/logger/system': systemLogger,
			});

			return {
				fn,
				restoreEnv: () => {
					process.env = originalEnv;
				},
			};
		};

		beforeEach(() => {
			models.Messages.col.indexes.reset();
			models.Messages.col.dropIndex.reset();
			models.Messages.col.createIndex.reset();
			systemLogger.SystemLogger.debug.reset();
			systemLogger.SystemLogger.startup.reset();
			systemLogger.SystemLogger.error.reset();
		});

		it('should do nothing if existing text index already matches desired default shape', async () => {
			models.Messages.col.indexes.resolves([{ name: 'messages_text', key: { _fts: 'text', _ftsx: 1 }, weights: validWeights }]);

			const { fn, restoreEnv } = loadEnsureMessagesTextIndex({ USE_ROOM_SEARCH_INDEX: 'false' });
			try {
				await fn();
				expect(models.Messages.col.dropIndex.called).to.be.false;
				expect(models.Messages.col.createIndex.called).to.be.false;
			} finally {
				restoreEnv();
			}
		});

		it('should drop stale legacy index and create new text index with attachment fields', async () => {
			models.Messages.col.indexes.resolves([{ name: 'old_msg_text', key: { _fts: 'text', _ftsx: 1 }, weights: { msg: 1 } }]);
			models.Messages.col.dropIndex.resolves();
			models.Messages.col.createIndex.resolves('messages_text');

			const { fn, restoreEnv } = loadEnsureMessagesTextIndex({ USE_ROOM_SEARCH_INDEX: 'false' });
			try {
				await fn();
				expect(models.Messages.col.dropIndex.calledOnceWith('old_msg_text')).to.be.true;
				expect(models.Messages.col.createIndex.calledOnceWith(TEXT_INDEX_FIELDS)).to.be.true;
			} finally {
				restoreEnv();
			}
		});

		it('should create room-scoped text index when USE_ROOM_SEARCH_INDEX is true', async () => {
			models.Messages.col.indexes.resolves([]);
			models.Messages.col.createIndex.resolves('messages_text_room');

			const { fn, restoreEnv } = loadEnsureMessagesTextIndex({ USE_ROOM_SEARCH_INDEX: 'true' });
			try {
				await fn();
				expect(models.Messages.col.createIndex.calledOnceWith({ rid: 1, ...TEXT_INDEX_FIELDS })).to.be.true;
			} finally {
				restoreEnv();
			}
		});

		it('should handle list indexes error gracefully', async () => {
			models.Messages.col.indexes.rejects(new Error('db connection error'));

			const { fn, restoreEnv } = loadEnsureMessagesTextIndex();
			try {
				await fn();
				expect(systemLogger.SystemLogger.error.calledOnce).to.be.true;
				expect(models.Messages.col.dropIndex.called).to.be.false;
				expect(models.Messages.col.createIndex.called).to.be.false;
			} finally {
				restoreEnv();
			}
		});

		it('should abort if dropIndex fails', async () => {
			models.Messages.col.indexes.resolves([{ name: 'old_msg_text', key: { _fts: 'text', _ftsx: 1 }, weights: { msg: 1 } }]);
			models.Messages.col.dropIndex.rejects(new Error('failed to drop'));

			const { fn, restoreEnv } = loadEnsureMessagesTextIndex();
			try {
				await fn();
				expect(systemLogger.SystemLogger.error.calledOnce).to.be.true;
				expect(models.Messages.col.createIndex.called).to.be.false;
			} finally {
				restoreEnv();
			}
		});
	});
});
