const statuses = ['Killed', 'Survived', 'NoCoverage', 'Timeout', 'CompileError', 'RuntimeError', 'Ignored', 'Pending'];

function sourceAt(source, { start, end }) {
	const lines = source.split('\n');
	if (start.line === end.line) return lines[start.line - 1].slice(start.column - 1, end.column - 1);
	return [
		lines[start.line - 1].slice(start.column - 1),
		...lines.slice(start.line, end.line - 1),
		lines[end.line - 1].slice(0, end.column - 1),
	].join('\n');
}

function runStatus({ completion, exitCode, signal, counts, report, valid }) {
	if (completion === 'dry-run' && exitCode === 0 && !signal) return 'dry-run';
	if (completion !== 'complete' || exitCode !== 0 || signal || counts.Pending || counts.RuntimeError) {
		return report ? 'incomplete' : 'failed';
	}
	if (!report) return 'failed';
	return valid ? 'complete' : 'no-mutants';
}

export function buildSummary(report, { packagePath, completion, exitCode, signal = null, minScore = null, targets = null, error = null }) {
	const counts = Object.fromEntries(statuses.map((status) => [status, 0]));
	const tests = new Map();
	for (const [file, info] of Object.entries(report?.testFiles ?? {})) {
		for (const test of info.tests ?? []) tests.set(test.id, { file, name: test.name, location: test.location });
	}
	const survivors = [];
	const ignored = [];
	for (const [file, info] of Object.entries(report?.files ?? {})) {
		for (const mutant of info.mutants) {
			const status = statuses.includes(mutant.status) ? mutant.status : 'Pending';
			counts[status]++;
			const location = { file, ...mutant.location };
			if (status === 'Survived' || status === 'NoCoverage') {
				survivors.push({
					id: mutant.id,
					status,
					mutator: mutant.mutatorName,
					location,
					original: sourceAt(info.source, mutant.location),
					replacement: mutant.replacement,
					coveringTests: (mutant.coveredBy ?? []).map((id) => tests.get(id) ?? { id }),
				});
			}
			if (status === 'Ignored') ignored.push({ id: mutant.id, location, mutator: mutant.mutatorName, reason: mutant.statusReason ?? null });
		}
	}
	const valid = counts.Killed + counts.Timeout + counts.Survived + counts.NoCoverage;
	const score = valid ? ((counts.Killed + counts.Timeout) / valid) * 100 : null;
	const status = runStatus({ completion, exitCode, signal, counts, report, valid });
	let gate = 'disabled';
	if (minScore !== null) gate = status === 'complete' && score >= minScore ? 'passed' : 'failed';
	return {
		package: packagePath,
		generatedAt: new Date().toISOString(),
		targets,
		status,
		exitCode,
		signal,
		error,
		counts,
		score,
		minScore,
		gate,
		survivors,
		ignored,
	};
}

export function summaryExitCode(summary) {
	if (summary.signal === 'SIGINT') return 130;
	if (summary.signal === 'SIGTERM') return 143;
	if (summary.status === 'failed' || summary.status === 'incomplete') return 3;
	return summary.gate === 'failed' ? 1 : 0;
}
