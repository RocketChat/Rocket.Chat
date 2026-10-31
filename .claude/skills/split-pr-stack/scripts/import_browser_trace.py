#!/usr/bin/env python3
"""Read preserved E2EE browser observations without filling unmeasured scenarios."""
import argparse
import json
from pathlib import Path
import sys


SCENARIOS = (
    'navigation-durability', 'logout-retention', 'successful-reset',
    'cancelled-reset', 'consent-withdrawal', 'offline-deletion',
    'offline-membership', 'account-switch', 'cleanup',
)


def read(directory, name):
    path = directory / name
    return json.loads(path.read_text()) if path.is_file() else None


def normalize(directory):
    results = read(directory, 'results.json') or []
    checks = {row.get('check'): row for row in results}
    observations = {key: {'status': 'UNVERIFIED', 'reason': 'Not established by this preserved fixture.'} for key in SCENARIOS}
    navigation = read(directory, 'navigation-probe.json')
    if navigation is not None:
        observations['navigation-durability'] = {
            'status': 'UNVERIFIED',
            'reason': 'Historical counts lack a bound acknowledgement and reinsertion trace.',
            'evidence': str(directory / 'navigation-probe.json'),
            'hits_before_navigation': navigation.get('bridgeHitsBeforeNavigation'),
            'hits_after_navigation': navigation.get('bridgeHitsAfterNavigation'),
        }
        if navigation.get('bridgeHitsBeforeNavigation') == 1 and navigation.get('bridgeHitsAfterNavigation') == 0:
            observations['navigation-durability']['status'] = 'FAIL'
            observations['navigation-durability']['reason'] = 'The real historical document disappeared during navigation.'
    reset = checks.get('Successful browser UI reset deletes old OPFS scope before relogin or substitute wipe')
    if reset:
        observations['successful-reset'].update(
            evidence=str(directory / 'results.json'),
            http_status=reset.get('httpStatus'), success=reset.get('success'),
            old_files_absent=reset.get('files') == [],
        )
    errors = read(directory, 'page-errors.json')
    rejections = read(directory, 'unhandled-rejections.json')
    if errors is not None and rejections is not None:
        observations['cleanup'].update(
            evidence=str(directory / 'cleanup.json'),
            page_errors=len(errors), unhandled_rejections=len(rejections),
        )
    return {
        'version': 1, 'backend': 'browser-opfs',
        'artifact': 'historical-unbound-browser-fixture',
        'environment': 'historical-real-chrome', 'log': str(directory / 'results.json'),
        'observations': observations,
        'limits': 'Partial historical import. No measured field is inferred from a PASS label. Bind current source and raw logs before reuse.',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(normalize(args.directory.resolve(strict=True)), indent=2))
    except (OSError, ValueError, TypeError, AttributeError) as error:
        print(json.dumps({'status': 'FAIL', 'failures': [str(error)]}))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
