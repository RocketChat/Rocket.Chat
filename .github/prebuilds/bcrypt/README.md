# bcrypt prebuilds

Prebuilt `napi-v3` binaries for **bcrypt 5.0.1**, built against **node-addon-api 8**.

## Why

Meteor's `accounts-password` bundles `bcrypt@5.0.1`, which pins `node-addon-api@^3.1.0`.
That old node-addon-api fails to compile against Node 24's V8 headers, and there is no
upstream linux-arm64 prebuild to fall back to — so `meteor build` / native installs
break on Node 24 (CI runs on linux-arm64).

Forcing bcrypt onto `node-addon-api@^8` compiles cleanly on Node 24. `napi-v3` is
ABI-stable across Node versions, so a single binary works for Node 22 and 24.

## How these are served

CI sets `npm_config_bcrypt_lib_binary_host_mirror` (see `.github/actions/setup-node`)
to the raw URL of this directory. `node-pre-gyp` then downloads the matching tarball
instead of compiling from source. The nested `kelektiv/node.bcrypt.js/releases/download/v5.0.1/`
path mirrors bcrypt's `remote_path`, which node-pre-gyp appends to the mirror base.

## Regenerating

Run the **Build bcrypt prebuilds** workflow (`.github/workflows/build-bcrypt-prebuilds.yml`),
download the artifacts, and replace the tarballs here. Bump the `v5.0.1` path if Meteor
ever ships a different bcrypt version.
