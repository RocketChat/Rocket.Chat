"""Check the stack against the real framework evidence checker in a temporary tree."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SKILL = Path(__file__).resolve().parents[1]
FRAMEWORK = Path.home() / 'Github/agentic-workflow-framework/skills/agentic-workflow'


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


class RealEvidenceIntegration(unittest.TestCase):
    def test_real_checker_rejects_failed_node_and_changed_source(self):
        checker = FRAMEWORK / 'scripts/evidence.py'
        if not checker.is_file():
            self.skipTest('Install the framework evidence checker for the cross-repository check.')
        evidence = module('evidence_integration', checker)
        stack = module('stack_integration', SKILL / 'scripts/stack_check.py')
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory).resolve()
            repo = home / 'repo'
            repo.mkdir()

            def git(*args):
                return subprocess.check_output(['git', '-C', str(repo), *args], stderr=subprocess.DEVNULL, text=True).strip()

            git('init', '-q')
            git('config', 'user.name', 'Test')
            git('config', 'user.email', 'test@example.invalid')
            git('config', 'commit.gpgsign', 'false')
            git('config', 'core.hooksPath', '/dev/null')
            workflow = repo / '.github/workflows/ci.yml'
            workflow.parent.mkdir(parents=True)
            workflow.write_text('name: CI\non: [pull_request]\njobs: {}\n')
            source = repo / 'BaseRaw.ts'
            source.write_text('export const value = 1;\n')
            git('add', '.')
            git('commit', '-qm', 'base')
            base = git('rev-parse', 'HEAD')
            git('checkout', '-qb', 'fix/model')
            source.write_text('export const value = 2;\n')
            git('commit', '-qam', 'fix')
            head = git('rev-parse', 'HEAD')
            permission_source = {'kind': 'user', 'reference': 'synthetic fixture request'}
            permissions = [{'action': action, 'status': 'not-requested', 'source': permission_source, 'scope': 'fixture'} for action in sorted(evidence.ACTIONS)]
            owners = [{'id': 'main', 'scope': 'fixture', 'source': permission_source}]
            command = {'argv': [sys.executable, '-c', 'print("PASS synthetic fixture")'], 'cwd': str(repo)}
            log = home / 'check.log'
            run = subprocess.run(command['argv'], cwd=repo, capture_output=True, text=True, timeout=10)
            log.write_text(run.stdout + run.stderr)
            scenario = {'id': 'ci-command', 'platform': 'local', 'claim': 'Synthetic check succeeds', 'owner': 'main',
                        'command': command, 'runtime': 'python synthetic fixture', 'environment': {}, 'provenance': 'synthetic', 'artifact_required': False}
            requirements = {'schema_version': 1, 'delivery': 'fixture', 'source': permission_source, 'source_paths': ['.'],
                            'scenarios': [scenario], 'permissions': permissions, 'owners': owners, 'decisions': [], 'conflicts': []}
            anchor = home / 'requirements.json'
            anchor.write_text(json.dumps(requirements))
            identity = evidence.repository_identity(repo, base, ['.'])
            row = {'id': 'ci-command', 'status': 'PASS', 'reason': '', 'decision': None,
                   'evidence': {'repository_sha256': evidence.identity(identity), 'checker_runtime': evidence.runtime_identity(),
                                **{key: copy.deepcopy(scenario[key]) for key in ('command', 'runtime', 'environment', 'provenance')},
                                'result': 'PASS', 'exit_code': run.returncode,
                                'log': {'path': str(log), 'sha256': evidence.digest(log.read_bytes())}, 'artifact': None}}
            manifest = {'schema_version': 1, 'delivery': 'fixture', 'requirements': {'path': str(anchor), 'sha256': evidence.digest(anchor.read_bytes())},
                        'repository': identity, 'checker_runtime': evidence.runtime_identity(), 'permissions': permissions, 'owners': owners,
                        'decisions': [], 'conflicts': [], 'matrix': [row]}
            manifest_path = home / 'evidence.json'
            node = {'id': 'fix', 'classification': 'fix', 'concern': 'Correct model value', 'branch': 'refs/heads/fix/model',
                    'head': head, 'base': base, 'dependencies': [], 'estimated_workflow_runs': 1, 'required_commands': [command],
                    'worktree': str(repo), 'evidence': str(manifest_path)}
            plan = {'version': 1, 'repository': str(repo), 'source': head, 'base': base, 'aggregate': head,
                    'ownership': {'BaseRaw.ts': ['fix']}, 'nodes': [node],
                    'ci': {'workflow_hashes': {'.github/workflows/ci.yml': hashlib.sha256(workflow.read_bytes()).hexdigest()},
                           'waves': [['fix']], 'estimate_basis': 'Synthetic PR trigger.'}}

            def save():
                manifest_path.write_text(json.dumps(manifest))
                node['evidence_sha256'] = evidence.digest(manifest_path.read_bytes())

            save()
            self.assertEqual(stack.check(plan, checker)['status'], 'PASS')
            for diagnostic in ('BaseRaw.ts:64:40: Replace newline with space', "Cannot find module '@rocket.chat/desktop-api'"):
                log.write_text(diagnostic + '\n')
                row['status'] = row['evidence']['result'] = 'FAIL'
                row['evidence']['exit_code'] = 1
                row['evidence']['log']['sha256'] = evidence.digest(log.read_bytes())
                save()
                self.assertEqual(stack.check(plan, checker)['status'], 'FAIL')
            row['status'] = row['evidence']['result'] = 'PASS'
            row['evidence']['exit_code'] = 0
            save()
            source.write_text('changed after verification\n')
            self.assertEqual(stack.check(plan, checker)['status'], 'FAIL')


if __name__ == '__main__':
    unittest.main()
