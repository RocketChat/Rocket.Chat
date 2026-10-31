#!/usr/bin/env python3
"""Check a proposed stack without changing branches or executing its checks."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


class InvalidPlan(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise InvalidPlan(message)


def git(repo, *args):
    result = subprocess.run(
        ['git', '-C', str(repo), *args], capture_output=True, timeout=30,
    )
    require(result.returncode == 0, 'Git lookup failed: ' + ' '.join(args[:2]))
    return result.stdout


def full_commit(repo, value):
    require(isinstance(value, str) and re.fullmatch(r'[0-9a-f]{40,64}', value), 'Use a full commit ID.')
    actual = git(repo, 'rev-parse', '--verify', value + '^{commit}').decode().strip()
    require(actual == value, 'Commit ID does not identify a commit.')
    return value


def paths_between(repo, base, head):
    return set(filter(None, git(repo, 'diff', '--no-renames', '--name-only', '-z', base, head).decode().split('\0')))


def tree_entry(repo, commit, path):
    return git(repo, 'ls-tree', commit, '--', path).split(b'\t', 1)[0]


def safe_path(path):
    require(isinstance(path, str) and path and not Path(path).is_absolute(), 'Use a repository-relative path.')
    require('..' not in Path(path).parts, 'Paths cannot leave the repository.')
    require(not path.startswith(('.localdev/', '.knowledge/', 'node_modules/', '.git/')), 'Private state cannot belong to a PR.')


def checked_evidence(checker, manifest, node):
    data = json.loads(manifest.read_text())
    require(data['schema_version'] == 1, 'Unsupported evidence schema.')
    worktree = Path(node['worktree']).resolve(strict=True)
    require(data['repository']['realpath'] == str(worktree), 'Evidence belongs to another worktree.')
    require(data['repository']['commit'] == node['head'], 'Evidence belongs to another node head.')
    require(data['repository']['dirty'] == [], 'Publication evidence must describe a clean node.')
    tracked = set(filter(None, git(worktree, 'ls-files', '-z').decode().split('\0')))
    inputs = {entry['path'] for entry in data['repository']['inputs']}
    require(tracked <= inputs, 'Publication evidence must cover all tracked node inputs, not only selected files.')
    require(git(worktree, 'rev-parse', 'HEAD').decode().strip() == node['head'], 'Worktree does not contain the node head.')
    require(data['repository']['base'] == node['base'], 'Evidence uses another comparison base.')
    digest = hashlib.sha256(manifest.read_bytes()).hexdigest()
    require(digest == node['evidence_sha256'], 'Evidence manifest changed.')
    result = subprocess.run(
        [sys.executable, '-I', str(checker), 'check', str(manifest), '--json'],
        capture_output=True, text=True, timeout=90,
    )
    require(result.returncode in (0, 1, 2), 'Evidence checker failed to run.')
    if result.returncode != 0:
        return result.returncode
    verified = [row['evidence']['command'] for row in data['matrix']
                if row['status'] == 'PASS' and row['evidence']['result'] == 'PASS']
    for command in node['required_commands']:
        require(command in verified, 'Evidence lacks an exact required command or its working directory.')
    return 0


def check(plan, checker):
    require(isinstance(plan, dict) and type(plan.get('version')) is int and plan['version'] == 1, 'Unsupported stack schema version.')
    repo = Path(plan['repository']).resolve(strict=True)
    require(git(repo, 'rev-parse', '--show-toplevel').decode().strip() == str(repo), 'Repository must name its root.')
    source = full_commit(repo, plan['source'])
    base = full_commit(repo, plan['base'])
    aggregate = full_commit(repo, plan['aggregate'])
    require(subprocess.run(['git', '-C', str(repo), 'merge-base', '--is-ancestor', base, source], capture_output=True, timeout=30).returncode == 0, 'Source must descend from the pinned base.')
    nodes = plan['nodes']
    require(isinstance(nodes, list) and nodes, 'A stack needs at least one node.')
    ids = [node['id'] for node in nodes]
    require(all(isinstance(key, str) and key for key in ids) and len(set(ids)) == len(ids), 'Node IDs must be nonempty and unique.')
    by_id = dict(zip(ids, nodes))
    changed_source = paths_between(repo, base, source)
    changed_aggregate = paths_between(repo, base, aggregate)
    ownership = plan['ownership']
    require(isinstance(ownership, dict) and ownership, 'Ownership must cover the source and aggregate changes.')
    require(set(ownership) == changed_source | changed_aggregate, 'Ownership does not cover exactly the changed source and aggregate paths.')
    for path, owners in ownership.items():
        safe_path(path)
        require(isinstance(owners, list) and owners and len(owners) == len(set(owners)), 'Each path needs unique owners.')
        require(set(owners) <= set(ids), 'Unknown path owner: ' + path)
    differences = {path for path in ownership if tree_entry(repo, source, path) != tree_entry(repo, aggregate, path)}
    exceptions = plan.get('parity_exceptions', {})
    require(set(exceptions) == differences, 'Record every source-to-aggregate difference, and remove stale exceptions.')
    for path, decision in exceptions.items():
        require(all(isinstance(decision.get(key), str) and decision[key].strip() for key in ('reason', 'approval_source')), 'Parity exceptions need a reason and approval source.')
    workflow_paths = set(filter(None, git(repo, 'ls-tree', '-r', '--name-only', base, '--', '.github/workflows').decode().splitlines()))
    require(workflow_paths, 'No workflow inventory exists at the base.')
    workflow_hashes = plan['ci']['workflow_hashes']
    require(set(workflow_hashes) == workflow_paths, 'Inventory every workflow at the pinned base.')
    for path, digest in workflow_hashes.items():
        actual = hashlib.sha256(git(repo, 'show', base + ':' + path)).hexdigest()
        require(digest == actual, 'Workflow snapshot changed: ' + path)
    waves = plan['ci']['waves']
    require(isinstance(waves, list) and waves and all(isinstance(wave, list) and wave for wave in waves), 'Publication waves must be nonempty lists.')
    flattened = [key for wave in waves for key in wave]
    require(len(flattened) == len(ids) and set(flattened) == set(ids), 'Waves must cover each node exactly once.')
    require(len(waves[0]) == 1, 'Start with one representative PR before a larger wave.')
    require(plan['ci'].get('estimate_basis'), 'Record the CI estimate assumptions, including push and PR triggers.')
    seen = set()
    estimates = []
    unknown = []
    failed = []
    for wave in waves:
        count = 0
        for key in wave:
            node = by_id[key]
            dependencies = node['dependencies']
            require(isinstance(dependencies, list) and len(dependencies) == len(set(dependencies)), 'Dependencies must be unique.')
            require(set(dependencies) <= seen, 'Publish dependencies in an earlier wave: ' + key)
            full_commit(repo, node['head'])
            full_commit(repo, node['base'])
            require(node['classification'] in ('fix', 'refactor', 'feature', 'test', 'chore', 'ci'), 'Unknown classification.')
            require(isinstance(node.get('concern'), str) and node['concern'].strip(), 'Each node needs one named concern.')
            require(node['base'] == base or any(by_id[d]['head'] == node['base'] for d in dependencies), 'Base must be the root or a declared dependency head.')
            for parent in [node['base'], *[by_id[d]['head'] for d in dependencies]]:
                result = subprocess.run(['git', '-C', str(repo), 'merge-base', '--is-ancestor', parent, node['head']], capture_output=True, timeout=30)
                require(result.returncode == 0, 'Node lacks its declared prerequisite: ' + key)
            require(subprocess.run(['git', '-C', str(repo), 'merge-base', '--is-ancestor', node['head'], aggregate], capture_output=True, timeout=30).returncode == 0, 'Aggregate does not contain node: ' + key)
            own_paths = paths_between(repo, node['base'], node['head'])
            declared = {path for path, owners in ownership.items() if key in owners}
            require(own_paths == declared and own_paths, 'Node diff does not match its owned paths: ' + key)
            require(isinstance(node['branch'], str) and node['branch'].startswith('refs/heads/'), 'Use a full local branch ref.')
            require(git(repo, 'rev-parse', '--verify', node['branch']).decode().strip() == node['head'], 'Branch moved: ' + key)
            runs = node['estimated_workflow_runs']
            require(type(runs) is int and runs >= 0, 'Estimated workflow count must be a nonnegative integer.')
            count += runs
            required = node['required_commands']
            require(isinstance(required, list) and required, 'Record the exact required CI commands.')
            for command in required:
                require(isinstance(command, dict) and set(command) == {'argv', 'cwd'}, 'Commands need argv and cwd.')
                require(isinstance(command['argv'], list) and command['argv'] and all(isinstance(arg, str) and arg for arg in command['argv']), 'Command arguments must be nonempty strings.')
                require(isinstance(command['cwd'], str) and Path(command['cwd']).is_absolute(), 'Command working directory must be absolute.')
            if not node.get('evidence'):
                unknown.append(key + ': missing evidence manifest')
            else:
                manifest = Path(node['evidence']).resolve(strict=True)
                code = checked_evidence(checker, manifest, node)
                if code == 1:
                    failed.append(key + ': evidence FAIL')
                elif code == 2:
                    unknown.append(key + ': evidence UNVERIFIED')
        seen.update(wave)
        estimates.append(count)
    status = 'FAIL' if failed else 'UNVERIFIED' if unknown else 'PASS'
    return {'status': status, 'nodes': len(nodes), 'workflow_runs_by_wave': estimates, 'estimated_workflow_runs': sum(estimates), 'failures': failed, 'unverified': unknown, 'limits': 'Structural and evidence checks only. Concern boundaries and workflow estimates need human review. No publication is authorized.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('plan', type=Path)
    parser.add_argument('--evidence-checker', type=Path, default=Path.home() / 'Github/agentic-workflow-framework/skills/agentic-workflow/scripts/evidence.py')
    args = parser.parse_args()
    try:
        result = check(json.loads(args.plan.read_text()), args.evidence_checker)
    except (InvalidPlan, KeyError, TypeError, ValueError, OSError, subprocess.TimeoutExpired) as error:
        result = {'status': 'FAIL', 'failures': [str(error)]}
    print(json.dumps(result, indent=2))
    return {'PASS': 0, 'FAIL': 1, 'UNVERIFIED': 2}[result['status']]


if __name__ == '__main__':
    sys.exit(main())
