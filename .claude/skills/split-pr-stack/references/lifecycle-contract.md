# Persistent lifecycle evidence

Use one trace per persistent backend and environment.
Browser OPFS and Desktop native storage share the scenario IDs below.
Memory fallback cannot establish persistence.

The checker consolidates invariants from the existing E2EE browser and packaged-app drivers.
It does not replace those drivers or alter their fixtures.
Run the real driver first, then normalize its observations into this contract.
Missing observations cannot support a PASS.

## Trace envelope

- `version`: `1`.
- `backend`: `browser-opfs` or `desktop-native`.
- `artifact`: the evidence manifest artifact ID.
- `environment`: the evidence manifest environment ID.
- `log`: the primary observation log path.
- `observations`: an object keyed by every scenario ID below.

Each scenario needs `status` and `evidence`.
Use `PASS` only with the required observations.
Use `FAIL` for a failed behavior.
Use `UNVERIFIED` with a `reason` when no valid observation exists.
The `evidence` value identifies the observation source and its location.

Booleans must be JSON booleans, not strings or numeric substitutes.
Counts must be JSON integers, not booleans.

## Required scenarios

| Scenario | Required observations |
| --- | --- |
| `navigation-durability` | `acknowledged=true`, `reinserted=false`, `server_source=false`, `hits_after_navigation=1` |
| `logout-retention` | `access_closed=true`, `consent_retained=true`, `checkpoint_retained=true`, `sealed_files_retained=true`, `server_source=false`, `reinserted=false`, `hits_after_relaunch=1` |
| `successful-reset` | `http_status=200`, `success=true`, `old_files_absent=true`, `access_closed=true`, `observed_before_cleanup=true`, `observed_before_relogin=true`, `new_key_old_hits=0` |
| `cancelled-reset` | `cancelled=true`, `old_files_retained=true`, `old_key_hits=1` |
| `consent-withdrawal` | `old_files_absent=true`, `access_closed=true`, `observed_before_cleanup=true` |
| `offline-deletion` | `mutation_while_stopped=true`, `deleted_hits_after_restart=0`, `retained_control_hits=1` |
| `offline-membership` | `mutation_while_stopped=true`, `removed_room_hits=0`, `retained_room_hits=1` |
| `account-switch` | `old_access_closed=true`, `old_pending_rejected=true`, `new_account_old_hits=0` |
| `cleanup` | `accounts_absent=true`, `rooms_absent=true`, `exact_settings_restored=true`, `owned_processes=0`, `page_errors=0`, `unhandled_rejections=0` |

## Capture procedure

1. Record the running build, backend, profile, and environment without secret values.
2. Insert a unique document through the real backend, with no server copy.
3. Wait for the mutation acknowledgement, then navigate without reinserting the document.
4. Check retention through logout, process restart, login, and unlock.
5. Check a cancelled reset separately from a successful reset.
6. Observe old storage before cleanup or new login can remove it.
7. Check that the new key cannot retrieve the old document.
8. Check offline removal and a retained control in the same run.
9. Check account switching with pending work from the old account.
10. Restore captured settings and independently check fixture removal.

Capture raw results before computing the normalized trace.
Bind both files and the checker output to the evidence manifest using content hashes.
Do not include credentials, private keys, or browser profiles in evidence archives.

## Negative controls

The synthetic tests reject these historical failure shapes:

- An acknowledged write disappears during navigation.
- A test reconstructs the retained document from the server.
- A test reinserts the document after navigation.
- A cancelled reset substitutes for successful reset coverage.
- Cleanup removes files before the reset deletion observation.
- A memory backend substitutes for persistent storage.
- A required scenario or observation is absent.

Synthetic negative controls prove the validator, not the app.
Run browser and packaged-app drivers for product evidence.
A truthful incomplete historical trace must remain `UNVERIFIED`.
