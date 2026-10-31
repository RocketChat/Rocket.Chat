import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


stack = load('stack_check')
lifecycle = load('lifecycle_check')
importer = load('import_browser_trace')


class HistoricalImportTests(unittest.TestCase):
    def test_missing_observations_are_not_fabricated(self):
        with tempfile.TemporaryDirectory() as directory:
            trace = importer.normalize(Path(directory))
            self.assertEqual(lifecycle.check(trace)['status'], 'UNVERIFIED')

    def test_failed_reload_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            probe = {'bridgeHitsBeforeNavigation': 1, 'bridgeHitsAfterNavigation': 0}
            (root / 'navigation-probe.json').write_text(json.dumps(probe))
            self.assertEqual(lifecycle.check(importer.normalize(root))['status'], 'FAIL')

    def test_passing_count_alone_does_not_certify_lifecycle(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            probe = {'bridgeHitsBeforeNavigation': 1, 'bridgeHitsAfterNavigation': 1}
            (root / 'navigation-probe.json').write_text(json.dumps(probe))
            self.assertEqual(lifecycle.check(importer.normalize(root))['status'], 'UNVERIFIED')


def good_trace():
    return {
        'version': 1, 'backend': 'browser-opfs', 'artifact': 'test-build',
        'environment': 'synthetic', 'log': 'test-fixture',
        'observations': {
            'navigation-durability': {'acknowledged': True, 'reinserted': False, 'server_source': False, 'hits_after_navigation': 1},
            'logout-retention': {'access_closed': True, 'consent_retained': True, 'checkpoint_retained': True, 'sealed_files_retained': True, 'server_source': False, 'reinserted': False, 'hits_after_relaunch': 1},
            'successful-reset': {'http_status': 200, 'success': True, 'old_files_absent': True, 'access_closed': True, 'observed_before_cleanup': True, 'observed_before_relogin': True, 'new_key_old_hits': 0},
            'cancelled-reset': {'cancelled': True, 'old_files_retained': True, 'old_key_hits': 1},
            'consent-withdrawal': {'old_files_absent': True, 'access_closed': True, 'observed_before_cleanup': True},
            'offline-deletion': {'mutation_while_stopped': True, 'deleted_hits_after_restart': 0, 'retained_control_hits': 1},
            'offline-membership': {'mutation_while_stopped': True, 'removed_room_hits': 0, 'retained_room_hits': 1},
            'account-switch': {'old_access_closed': True, 'old_pending_rejected': True, 'new_account_old_hits': 0},
            'cleanup': {'accounts_absent': True, 'rooms_absent': True, 'exact_settings_restored': True, 'owned_processes': 0, 'page_errors': 0, 'unhandled_rejections': 0},
        },
    }


class LifecycleTests(unittest.TestCase):
    def setUp(self):
        self.trace = good_trace()
        for row in self.trace['observations'].values():
            row.update(status='PASS', evidence='synthetic negative-control fixture')

    def test_both_persistent_backends(self):
        for backend in ('browser-opfs', 'desktop-native'):
            self.trace['backend'] = backend
            self.assertEqual(lifecycle.check(self.trace)['status'], 'PASS')

    def test_cancelled_reset_does_not_prove_successful_reset(self):
        del self.trace['observations']['successful-reset']
        self.assertEqual(lifecycle.check(self.trace)['status'], 'UNVERIFIED')

    def test_every_observable_is_required(self):
        for scenario, row in self.trace['observations'].items():
            for field in set(row) - {'status', 'evidence'}:
                bad = copy.deepcopy(self.trace)
                del bad['observations'][scenario][field]
                self.assertEqual(lifecycle.check(bad)['status'], 'FAIL', (scenario, field))

    def test_reconstruction_and_reinsertion_are_not_retention(self):
        for field in ('server_source', 'reinserted'):
            bad = copy.deepcopy(self.trace)
            bad['observations']['logout-retention'][field] = True
            self.assertEqual(lifecycle.check(bad)['status'], 'FAIL')

    def test_acknowledged_write_must_survive_navigation(self):
        self.trace['observations']['navigation-durability']['hits_after_navigation'] = 0
        self.assertEqual(lifecycle.check(self.trace)['status'], 'FAIL')

    def test_cleanup_cannot_prove_reset_deletion(self):
        self.trace['observations']['successful-reset']['observed_before_cleanup'] = False
        self.assertEqual(lifecycle.check(self.trace)['status'], 'FAIL')

    def test_memory_fallback_is_not_persistence(self):
        self.trace['backend'] = 'memory'
        self.assertEqual(lifecycle.check(self.trace)['status'], 'FAIL')

    def test_explicit_missing_check_remains_unverified(self):
        self.trace['observations']['cleanup'] = {'status': 'UNVERIFIED', 'reason': 'Settings snapshot missing.'}
        self.assertEqual(lifecycle.check(self.trace)['status'], 'UNVERIFIED')

    def test_boolean_is_not_a_hit_count(self):
        self.trace['observations']['logout-retention']['hits_after_relaunch'] = True
        self.assertEqual(lifecycle.check(self.trace)['status'], 'FAIL')


class StackTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name).resolve()
        self.git('init', '-q')
        self.git('config', 'user.name', 'Test')
        self.git('config', 'user.email', 'test@example.invalid')
        self.git('config', 'commit.gpgsign', 'false')
        self.git('config', 'core.hooksPath', '/dev/null')
        workflow = self.repo / '.github/workflows/ci.yml'
        workflow.parent.mkdir(parents=True)
        workflow.write_text('name: CI\non: [pull_request]\njobs: {}\n')
        (self.repo / 'model.ts').write_text('export const value = 1;\n')
        self.git('add', '.')
        self.git('commit', '-qm', 'base')
        base = self.git('rev-parse', 'HEAD')
        self.git('checkout', '-qb', 'fix/model')
        (self.repo / 'model.ts').write_text('export const value = 2;\n')
        self.git('commit', '-qam', 'fix')
        head = self.git('rev-parse', 'HEAD')
        self.plan = {
            'version': 1, 'repository': str(self.repo), 'source': head,
            'base': base, 'aggregate': head,
            'ownership': {'model.ts': ['fix-model']},
            'nodes': [{'id': 'fix-model', 'classification': 'fix', 'concern': 'Correct model value',
                       'branch': 'refs/heads/fix/model', 'base': base, 'head': head,
                       'dependencies': [], 'estimated_workflow_runs': 1, 'required_commands': [{'argv': ['yarn', 'oxlint'], 'cwd': str(self.repo)}]}],
            'ci': {'workflow_hashes': {'.github/workflows/ci.yml': hashlib.sha256(workflow.read_bytes()).hexdigest()},
                   'waves': [['fix-model']], 'estimate_basis': 'One PR workflow, no feature-branch push workflow.'},
        }

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.repo), *args], stderr=subprocess.DEVNULL, text=True).strip()

    def check(self):
        return stack.check(self.plan, Path('/missing-checker'))

    def evidence_fixture(self, result='PASS', command=None):
        node = self.plan['nodes'][0]
        node['worktree'] = str(self.repo)
        data = {'schema_version': 1, 'repository': {'realpath': str(self.repo), 'commit': node['head'], 'base': node['base'], 'dirty': [], 'inputs': []},
                'matrix': [{'status': result, 'evidence': {'result': result, 'command': command or node['required_commands'][0]}}]}
        manifest = self.repo / 'evidence.json'
        manifest.write_text(json.dumps(data))
        node['evidence'] = str(manifest)
        node['evidence_sha256'] = hashlib.sha256(manifest.read_bytes()).hexdigest()
        return node, manifest

    def test_binding_accepts_exact_node_and_command(self):
        node, manifest = self.evidence_fixture()
        run = subprocess.CompletedProcess([], 0)
        with patch.object(stack.subprocess, 'run', return_value=run), patch.object(stack, 'git', side_effect=lambda repo, *args: b'' if args[0] == 'ls-files' else node['head'].encode()):
            self.assertEqual(stack.checked_evidence(Path('/checker'), manifest, node), 0)

    def test_partial_lint_cannot_replace_ci_command(self):
        node, manifest = self.evidence_fixture(command={'argv': ['yarn', 'oxlint', 'model.ts'], 'cwd': '.'})
        run = subprocess.CompletedProcess([], 0)
        with patch.object(stack.subprocess, 'run', return_value=run), patch.object(stack, 'git', side_effect=lambda repo, *args: b'' if args[0] == 'ls-files' else node['head'].encode()):
            with self.assertRaisesRegex(stack.InvalidPlan, 'exact required command'):
                stack.checked_evidence(Path('/checker'), manifest, node)

    def test_failed_node_check_is_not_aggregate_success(self):
        node, manifest = self.evidence_fixture(result='FAIL')
        run = subprocess.CompletedProcess([], 1)
        with patch.object(stack.subprocess, 'run', return_value=run), patch.object(stack, 'git', side_effect=lambda repo, *args: b'' if args[0] == 'ls-files' else node['head'].encode()):
            self.assertEqual(stack.checked_evidence(Path('/checker'), manifest, node), 1)

    def test_unverified_install_is_not_a_lint_failure(self):
        node, manifest = self.evidence_fixture(result='UNVERIFIED')
        run = subprocess.CompletedProcess([], 2)
        with patch.object(stack.subprocess, 'run', return_value=run), patch.object(stack, 'git', side_effect=lambda repo, *args: b'' if args[0] == 'ls-files' else node['head'].encode()):
            self.assertEqual(stack.checked_evidence(Path('/checker'), manifest, node), 2)

    def test_wrong_evidence_worktree_fails(self):
        node, manifest = self.evidence_fixture()
        node['worktree'] = str(self.repo.parent)
        with self.assertRaisesRegex(stack.InvalidPlan, 'another worktree'):
            stack.checked_evidence(Path('/checker'), manifest, node)

    def test_missing_evidence_is_not_a_pass(self):
        result = self.check()
        self.assertEqual(result['status'], 'UNVERIFIED')
        self.assertEqual(result['estimated_workflow_runs'], 1)

    def test_missing_owner_fails(self):
        self.plan['ownership'] = {}
        with self.assertRaisesRegex(stack.InvalidPlan, 'Ownership'):
            self.check()

    def test_wrong_branch_tip_fails(self):
        self.git('commit', '--allow-empty', '-qm', 'later')
        with self.assertRaisesRegex(stack.InvalidPlan, 'Branch moved'):
            self.check()

    def test_missing_dependency_fails(self):
        self.plan['nodes'][0]['dependencies'] = ['absent']
        with self.assertRaisesRegex(stack.InvalidPlan, 'earlier wave'):
            self.check()

    def test_wrong_aggregate_does_not_inherit_a_pass(self):
        self.plan['aggregate'] = self.plan['base']
        with self.assertRaisesRegex(stack.InvalidPlan, 'difference'):
            self.check()

    def test_workflow_snapshot_must_match(self):
        self.plan['ci']['workflow_hashes']['.github/workflows/ci.yml'] = '0' * 64
        with self.assertRaisesRegex(stack.InvalidPlan, 'Workflow snapshot'):
            self.check()

    def test_every_node_needs_exact_commands(self):
        self.plan['nodes'][0]['required_commands'] = []
        with self.assertRaisesRegex(stack.InvalidPlan, 'exact required CI commands'):
            self.check()

    def test_relative_command_directory_fails(self):
        self.plan['nodes'][0]['required_commands'][0]['cwd'] = '.'
        with self.assertRaisesRegex(stack.InvalidPlan, 'absolute'):
            self.check()

    def test_duplicate_wave_does_not_publish_twice(self):
        self.plan['ci']['waves'].append(['fix-model'])
        with self.assertRaisesRegex(stack.InvalidPlan, 'exactly once'):
            self.check()

    def test_unrecorded_diff_fails(self):
        self.plan['ownership']['extra.ts'] = ['fix-model']
        with self.assertRaisesRegex(stack.InvalidPlan, 'exactly'):
            self.check()


if __name__ == '__main__':
    unittest.main()
