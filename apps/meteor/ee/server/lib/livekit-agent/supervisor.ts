import { spawn, type ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

import { settings } from '../../../../app/settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { getLiveKitConfig } from '../livekit/config';

// Exponential backoff between respawns — 1s, 2s, 5s, 10s, 30s cap. A
// crash-looping worker (bad Gemini key, missing LK creds, etc.) shouldn't
// peg CPU. After a successful 60s run the counter resets so transient
// disconnects don't poison long-term scheduling.
const BACKOFF_STEPS_MS = [1000, 2000, 5000, 10000, 30000];
const STABLE_RUN_MS = 60_000;

type SupervisorState = {
	child: ChildProcess | null;
	desired: boolean;
	restarts: number;
	stableTimer: ReturnType<typeof setTimeout> | null;
};

const state: SupervisorState = {
	child: null,
	desired: false,
	restarts: 0,
	stableTimer: null,
};

const resolveWorkerPath = (): string | null => {
	// Source location (dev) + bundle location (prod) candidates. cwd at
	// runtime varies wildly: meteor dev cd's into .meteor/local/build/...,
	// production runs from bundle/programs/server, and monorepo dev can
	// run from the repo root. We try a generous set and pick the first
	// that exists.
	const cwd = process.cwd();
	const candidates = [
		// Dev — running from apps/meteor with the source tree intact
		path.resolve(cwd, 'private/livekit-agent/worker.mjs'),
		path.resolve(cwd, 'apps/meteor/private/livekit-agent/worker.mjs'),
		// Dev — running from .meteor/local/build/programs/server
		path.resolve(cwd, '../../../../private/livekit-agent/worker.mjs'),
		path.resolve(cwd, '../../../../apps/meteor/private/livekit-agent/worker.mjs'),
		// Dev — running from .meteor/local/build
		path.resolve(cwd, '../../../private/livekit-agent/worker.mjs'),
		// Prod bundle — assets directly accessible
		path.resolve(cwd, 'programs/server/assets/app/livekit-agent/worker.mjs'),
		path.resolve(cwd, '../web.browser/app/livekit-agent/worker.mjs'),
		path.resolve(cwd, 'assets/app/livekit-agent/worker.mjs'),
	];
	const found = candidates.find((p) => existsSync(p));
	if (!found) {
		SystemLogger.warn({ msg: '[livekit-agent] worker.mjs not found', cwd, candidates });
	} else {
		SystemLogger.info({ msg: '[livekit-agent] worker.mjs resolved', cwd, path: found });
	}
	return found || null;
};

const computeEnv = (): Record<string, string> | null => {
	const lk = getLiveKitConfig();
	const geminiKey = settings.get<string>('VoIP_TeamCollab_LiveKit_Agent_Gemini_Api_Key') || '';
	const missing: string[] = [];
	if (!lk.enabled) missing.push('VoIP_TeamCollab_LiveKit_Enabled');
	if (!lk.url) missing.push('VoIP_TeamCollab_LiveKit_Url');
	if (!lk.apiKey) missing.push('VoIP_TeamCollab_LiveKit_Api_Key');
	if (!lk.apiSecret) missing.push('VoIP_TeamCollab_LiveKit_Api_Secret');
	if (!geminiKey) missing.push('VoIP_TeamCollab_LiveKit_Agent_Gemini_Api_Key');
	if (missing.length > 0) {
		SystemLogger.warn({ msg: '[livekit-agent] required settings missing', missing });
		return null;
	}

	const env: Record<string, string> = {
		...(process.env as Record<string, string>),
		LIVEKIT_URL: lk.url,
		LIVEKIT_API_KEY: lk.apiKey,
		LIVEKIT_API_SECRET: lk.apiSecret,
		GEMINI_API_KEY: geminiKey,
		METEOR_BASE_URL: settings.get<string>('Site_Url') || 'http://localhost:3000',
		METEOR_SHARED_SECRET: lk.apiSecret,
	};
	const model = settings.get<string>('VoIP_TeamCollab_LiveKit_Agent_Gemini_Model');
	if (model) env.GEMINI_LIVE_MODEL = model;
	const lang = settings.get<string>('VoIP_TeamCollab_LiveKit_Agent_Language_Hint');
	if (lang) env.STT_LANGUAGE_HINT = lang;
	return env;
};

const spawnWorker = (): void => {
	if (!state.desired) return;
	if (state.child) return;

	const workerPath = resolveWorkerPath();
	if (!workerPath) {
		SystemLogger.warn('[livekit-agent] worker.mjs not found in expected locations; not starting');
		return;
	}
	const env = computeEnv();
	if (!env) {
		SystemLogger.warn('[livekit-agent] missing required settings (LK / Gemini); not starting');
		return;
	}

	SystemLogger.info({ msg: '[livekit-agent] spawning worker', path: workerPath });
	const child = spawn(process.execPath, [workerPath, 'start'], {
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	state.child = child;
	const startedAt = Date.now();

	const tag = `[livekit-agent:${child.pid}]`;
	child.stdout?.on('data', (buf: Buffer) => {
		const text = buf.toString().trimEnd();
		if (text) SystemLogger.info(`${tag} ${text}`);
	});
	child.stderr?.on('data', (buf: Buffer) => {
		const text = buf.toString().trimEnd();
		if (text) SystemLogger.warn(`${tag} ${text}`);
	});

	// After STABLE_RUN_MS of uptime we consider the spawn a success and
	// reset the backoff counter — a transient crash a week later shouldn't
	// inherit the rapid-respawn budget from this morning.
	state.stableTimer = setTimeout(() => {
		state.restarts = 0;
	}, STABLE_RUN_MS);

	child.on('exit', (code, signal) => {
		SystemLogger.info({ msg: `${tag} exited`, code, signal, uptimeMs: Date.now() - startedAt });
		if (state.stableTimer) clearTimeout(state.stableTimer);
		state.stableTimer = null;
		state.child = null;
		if (!state.desired) return;
		const delay = BACKOFF_STEPS_MS[Math.min(state.restarts, BACKOFF_STEPS_MS.length - 1)];
		state.restarts += 1;
		SystemLogger.info(`[livekit-agent] respawning in ${delay}ms (attempt ${state.restarts})`);
		setTimeout(spawnWorker, delay);
	});
};

const stopWorker = (): void => {
	state.desired = false;
	const { child } = state;
	if (!child) return;
	if (state.stableTimer) clearTimeout(state.stableTimer);
	state.stableTimer = null;
	// Give the worker a chance to flush its in-flight transcripts and close
	// the Gemini sessions cleanly before we resort to SIGKILL.
	child.kill('SIGTERM');
	const grace = setTimeout(() => {
		if (!child.killed) child.kill('SIGKILL');
	}, 5000);
	child.once('exit', () => clearTimeout(grace));
};

/**
 * Idempotent start. Safe to call repeatedly when settings change — re-checks
 * whether the worker should be running and starts/stops accordingly.
 */
export const startLiveKitAgentSupervisor = (): void => {
	const mode = settings.get<string>('VoIP_TeamCollab_LiveKit_Agent_Mode') || 'off';
	SystemLogger.info({ msg: '[livekit-agent] supervisor invoked', mode });
	if (mode === 'embedded') {
		if (state.desired) return;
		state.desired = true;
		state.restarts = 0;
		spawnWorker();
		return;
	}
	// 'off' or 'external' — ensure no embedded worker running.
	if (state.desired) {
		stopWorker();
	}
};

// Stop the worker when Meteor itself is shutting down so we don't leave
// orphaned processes connected to LK.
process.once('SIGTERM', stopWorker);
process.once('SIGINT', stopWorker);
process.once('beforeExit', stopWorker);

// React to settings changes at runtime so flipping the mode toggle or
// editing the Gemini key doesn't require a server restart. `watchByRegex`
// fires once per matching key change; we debounce by always re-running
// startLiveKitAgentSupervisor (idempotent).
let watchersInstalled = false;
export const installLiveKitAgentSettingsWatchers = (): void => {
	if (watchersInstalled) return;
	watchersInstalled = true;
	settings.watchByRegex(
		/^VoIP_TeamCollab_LiveKit_(Agent_(Mode|Gemini_Api_Key|Gemini_Model|Language_Hint)|Enabled|Url|Api_Key|Api_Secret)$/,
		() => {
			// If the worker is already up, recycle it so it picks up the new env.
			if (state.desired && state.child) {
				SystemLogger.info('[livekit-agent] settings changed; recycling worker');
				const { child } = state;
				state.desired = false; // prevent respawn from this exit
				child.once('exit', () => {
					// Re-enable and respawn with the new env
					startLiveKitAgentSupervisor();
				});
				child.kill('SIGTERM');
				return;
			}
			startLiveKitAgentSupervisor();
		},
	);
};
