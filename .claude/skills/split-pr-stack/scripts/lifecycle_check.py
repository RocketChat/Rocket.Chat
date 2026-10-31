#!/usr/bin/env python3
"""Validate browser or Desktop lifecycle observations, not release readiness."""
import argparse
import json
from pathlib import Path
import sys


SCENARIOS = (
    'navigation-durability', 'logout-retention', 'successful-reset',
    'cancelled-reset', 'consent-withdrawal', 'offline-deletion',
    'offline-membership', 'account-switch', 'cleanup',
)


def check(trace):
    failures = []
    missing = []
    if not isinstance(trace, dict) or type(trace.get('version')) is not int or trace['version'] != 1:
        return {'status': 'FAIL', 'failures': ['Unsupported lifecycle trace version.']}
    if trace.get('backend') not in ('browser-opfs', 'desktop-native'):
        return {'status': 'FAIL', 'failures': ['Persistent backend required. Memory fallback is not persistent coverage.']}
    for key in ('artifact', 'environment', 'log'):
        if not isinstance(trace.get(key), str) or not trace[key].strip():
            missing.append('Missing ' + key)
    observations = trace.get('observations')
    if not isinstance(observations, dict):
        return {'status': 'FAIL', 'failures': ['Observations must be an object.']}
    extra = set(observations) - set(SCENARIOS)
    if extra:
        failures.append('Unknown scenarios: ' + ', '.join(sorted(extra)))
    for scenario in SCENARIOS:
        row = observations.get(scenario)
        if not isinstance(row, dict):
            missing.append(scenario)
            continue
        if row.get('status') == 'UNVERIFIED':
            missing.append(scenario + ': ' + str(row.get('reason', 'No reason recorded.')))
            continue
        if row.get('status') != 'PASS':
            failures.append(scenario + ': scenario failed or status is invalid')
            continue
        expected = {
            'navigation-durability': {'acknowledged': True, 'reinserted': False, 'server_source': False, 'hits_after_navigation': 1},
            'logout-retention': {'access_closed': True, 'consent_retained': True, 'checkpoint_retained': True, 'sealed_files_retained': True, 'server_source': False, 'reinserted': False, 'hits_after_relaunch': 1},
            'successful-reset': {'http_status': 200, 'success': True, 'old_files_absent': True, 'access_closed': True, 'observed_before_cleanup': True, 'observed_before_relogin': True, 'new_key_old_hits': 0},
            'cancelled-reset': {'cancelled': True, 'old_files_retained': True, 'old_key_hits': 1},
            'consent-withdrawal': {'old_files_absent': True, 'access_closed': True, 'observed_before_cleanup': True},
            'offline-deletion': {'mutation_while_stopped': True, 'deleted_hits_after_restart': 0, 'retained_control_hits': 1},
            'offline-membership': {'mutation_while_stopped': True, 'removed_room_hits': 0, 'retained_room_hits': 1},
            'account-switch': {'old_access_closed': True, 'old_pending_rejected': True, 'new_account_old_hits': 0},
            'cleanup': {'accounts_absent': True, 'rooms_absent': True, 'exact_settings_restored': True, 'owned_processes': 0, 'page_errors': 0, 'unhandled_rejections': 0},
        }[scenario]
        for key, value in expected.items():
            actual = row.get(key)
            if type(actual) is not type(value) or actual != value:
                failures.append(scenario + ': invalid or missing ' + key)
        if not isinstance(row.get('evidence'), str) or not row['evidence'].strip():
            missing.append(scenario + ': missing observation source')
    return {
        'status': 'FAIL' if failures else 'UNVERIFIED' if missing else 'PASS',
        'failures': failures, 'unverified': missing,
        'limits': 'This checks trace completeness and invariants. Bind the trace to source and hashed logs with the evidence checker. It does not authenticate observations.',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('trace', type=Path)
    args = parser.parse_args()
    try:
        result = check(json.loads(args.trace.read_text()))
    except (OSError, ValueError, TypeError) as error:
        result = {'status': 'FAIL', 'failures': [str(error)]}
    print(json.dumps(result, indent=2))
    return {'PASS': 0, 'FAIL': 1, 'UNVERIFIED': 2}[result['status']]


if __name__ == '__main__':
    sys.exit(main())
