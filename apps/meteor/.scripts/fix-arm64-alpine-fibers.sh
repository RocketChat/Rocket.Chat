#!/bin/ash
set -xe

cat <<EOF
Why this ugliness?
There are two reasons.
1. For some reason yarn is adding a "node-gyp" script in PATH when running yarn workspaces focus. This shadows any actual installation of node-gyp, and looks for a script at the top level workspace. Adding node-gyp at the root workspace doesn't work either.
2. On arm64, fibers uses ucontexts instead of pthreads. But sadly, my naive attempts at linking with ucontext all failed on arm64 alpine. Why? Very likely I am just that stupid. At this point I am attempting to return to pthreads for arm64 ..hoping this will work and last known issues have been fixed since then.
EOF

apply_patch() {
	# https://github.com/debdutdeb/node-fibers/blob/rocketchat-arm64-build-patch/binding.gyp.patch
	cat <<EOF > binding.gyp.patch
From d0f0f79ce4a938c5b5a2b577e11f05204e193521 Mon Sep 17 00:00:00 2001
From: Debdut Chakraborty <debdutdeb@outlook.com>
Date: Fri, 17 Nov 2023 10:31:16 +0530
Subject: [PATCH] fix arm64 build

---
 binding.gyp | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)

diff --git a/binding.gyp b/binding.gyp
index 2289325..cc5c62f 100644
--- a/binding.gyp
+++ b/binding.gyp
@@ -65,8 +65,8 @@
 				['target_arch == "arm64"',
 					{
 						# There's been problems getting real fibers working on arm
-						'defines': ['CORO_UCONTEXT', '_XOPEN_SOURCE'],
-						'defines!': ['CORO_PTHREAD', 'CORO_SJLJ', 'CORO_ASM'],
+						'defines': ['CORO_PTHREAD', '_XOPEN_SOURCE'],
+						'defines!': ['CORO_UCONTEXT', 'CORO_SJLJ', 'CORO_ASM'],
 					},
 				],
 			],
--
2.39.3 (Apple Git-145)
EOF
	patch < binding.gyp.patch
}
npm install node-gyp@9.4.1 -g
apply_patch
node build.js --silly
node quick-test.js
rm -rf build
npm uninstall node-gyp -g

rm -f $0
