import { exec } from 'child_process';
import os from 'os';
import util from 'util';
import path from 'path';
import fs from 'fs';
import https from 'https';

const execAsync = util.promisify(exec);

class VersionCompiler {
	async processFilesForTarget(files) {
		const processVersionFile = async function (file) {
			file.addJavaScript({
				data: `exports.supportedVersions = ${JSON.stringify({
					signed:
						'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aW1lc3RhbXAiOiIyMDI1LTExLTI3VDE2OjA4OjA2LjYyMzg2MDQzM1oiLCJtZXNzYWdlcyI6W3sicmVtYWluaW5nRGF5cyI6MTUsInRpdGxlIjoidmVyc2lvbl91bnN1cHBvcnRlZF94X2RheXNfcmVtYWluaW5nX3RpdGxlIiwic3VidGl0bGUiOiJ2ZXJzaW9uX3Vuc3VwcG9ydGVkX3hfZGF5c19yZW1haW5pbmdfc3VidGl0bGUiLCJkZXNjcmlwdGlvbiI6InZlcnNpb25fdW5zdXBwb3J0ZWRfeF9kYXlzX3JlbWFpbmluZ19ib2R5IiwidHlwZSI6ImluZm8iLCJwYXJhbXMiOnsibWluaW11bVN1cHBvcnRlZFZlcnNpb24iOiI3LjcuMCJ9LCJsaW5rIjoiIn0seyJyZW1haW5pbmdEYXlzIjoxLCJ0aXRsZSI6InZlcnNpb25fdW5zdXBwb3J0ZWRfZmluYWxfZGF5X3JlbWFpbmluZ190aXRsZSIsInN1YnRpdGxlIjoidmVyc2lvbl91bnN1cHBvcnRlZF9maW5hbF9kYXlfc3VidGl0bGUiLCJkZXNjcmlwdGlvbiI6InZlcnNpb25fdW5zdXBwb3J0ZWRfZmluYWxfZGF5X2JvZHkiLCJ0eXBlIjoiaW5mbyIsInBhcmFtcyI6eyJtaW5pbXVtU3VwcG9ydGVkVmVyc2lvbiI6IjcuNy4wIn0sImxpbmsiOiIifV0sInZlcnNpb25zIjpbeyJ2ZXJzaW9uIjoiNy4xMi4yIiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuMTIuMiIsImV4cGlyYXRpb24iOiIyMDI2LTA1LTMxVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuOS4zIiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuOS4zIiwiZXhwaXJhdGlvbiI6IjIwMjYtMDEtMzFUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy42LjAiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy42LjAiLCJleHBpcmF0aW9uIjoiMjAyNS0xMS0zMFQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjYuMSIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjYuMSIsImV4cGlyYXRpb24iOiIyMDI1LTExLTMwVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuNi4yIiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuNi4yIiwiZXhwaXJhdGlvbiI6IjIwMjUtMTEtMzBUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy42LjMiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy42LjMiLCJleHBpcmF0aW9uIjoiMjAyNS0xMS0zMFQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjYuNCIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjYuNCIsImV4cGlyYXRpb24iOiIyMDI1LTExLTMwVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuNi41Iiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuNi41IiwiZXhwaXJhdGlvbiI6IjIwMjUtMTEtMzBUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy42LjYiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy42LjYiLCJleHBpcmF0aW9uIjoiMjAyNS0xMS0zMFQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjcuMCIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjcuMCIsImV4cGlyYXRpb24iOiIyMDI1LTEyLTMxVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuNy4xIiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuNy4xIiwiZXhwaXJhdGlvbiI6IjIwMjUtMTItMzFUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy43LjMiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy43LjMiLCJleHBpcmF0aW9uIjoiMjAyNS0xMi0zMVQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjcuNCIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjcuNCIsImV4cGlyYXRpb24iOiIyMDI1LTEyLTMxVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuNy41Iiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuNy41IiwiZXhwaXJhdGlvbiI6IjIwMjUtMTItMzFUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy43LjYiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy43LjYiLCJleHBpcmF0aW9uIjoiMjAyNS0xMi0zMVQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjcuNyIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjcuNyIsImV4cGlyYXRpb24iOiIyMDI1LTEyLTMxVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuNy44Iiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuNy44IiwiZXhwaXJhdGlvbiI6IjIwMjUtMTItMzFUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy43LjkiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy43LjkiLCJleHBpcmF0aW9uIjoiMjAyNS0xMi0zMVQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjguMCIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjguMCIsImV4cGlyYXRpb24iOiIyMDI2LTAxLTMxVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuOC4xIiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuOC4xIiwiZXhwaXJhdGlvbiI6IjIwMjYtMDEtMzFUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy44LjIiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy44LjIiLCJleHBpcmF0aW9uIjoiMjAyNi0wMS0zMVQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjguMyIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjguMyIsImV4cGlyYXRpb24iOiIyMDI2LTAxLTMxVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuOS4wIiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuOS4wIiwiZXhwaXJhdGlvbiI6IjIwMjYtMDEtMzFUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy45LjEiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy45LjEiLCJleHBpcmF0aW9uIjoiMjAyNi0wMS0zMVQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjguNCIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjguNCIsImV4cGlyYXRpb24iOiIyMDI2LTAxLTMxVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuOS40Iiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuOS40IiwiZXhwaXJhdGlvbiI6IjIwMjYtMDEtMzFUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy45LjUiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy45LjUiLCJleHBpcmF0aW9uIjoiMjAyNi0wMS0zMVQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjkuNiIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjkuNiIsImV4cGlyYXRpb24iOiIyMDI2LTAxLTMxVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuMTEuMCIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjExLjAiLCJleHBpcmF0aW9uIjoiMjAyNi0wNC0zMFQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjExLjEiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy4xMS4xIiwiZXhwaXJhdGlvbiI6IjIwMjYtMDQtMzBUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy4xMS4yIiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuMTEuMiIsImV4cGlyYXRpb24iOiIyMDI2LTA0LTMwVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuMTIuMCIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjEyLjAiLCJleHBpcmF0aW9uIjoiMjAyNi0wNS0zMVQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjEyLjEiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy4xMi4xIiwiZXhwaXJhdGlvbiI6IjIwMjYtMDUtMzFUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy4xMC4wIiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuMTAuMCIsImV4cGlyYXRpb24iOiIyMDI2LTA2LTMwVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuMTAuMSIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjEwLjEiLCJleHBpcmF0aW9uIjoiMjAyNi0wNi0zMFQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjEwLjIiLCJzZWN1cml0eSI6ZmFsc2UsImluZm9VcmwiOiJodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9yZWxlYXNlcy90YWcvNy4xMC4yIiwiZXhwaXJhdGlvbiI6IjIwMjYtMDYtMzBUMjM6NTk6NTkuOTk5WiIsInJlbGVhc2VUeXBlIjoic3RhYmxlIn0seyJ2ZXJzaW9uIjoiNy4xMC4zIiwic2VjdXJpdHkiOmZhbHNlLCJpbmZvVXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvcmVsZWFzZXMvdGFnLzcuMTAuMyIsImV4cGlyYXRpb24iOiIyMDI2LTA2LTMwVDIzOjU5OjU5Ljk5OVoiLCJyZWxlYXNlVHlwZSI6InN0YWJsZSJ9LHsidmVyc2lvbiI6IjcuMTAuNCIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjEwLjQiLCJleHBpcmF0aW9uIjoiMjAyNi0wNi0zMFQyMzo1OTo1OS45OTlaIiwicmVsZWFzZVR5cGUiOiJzdGFibGUifSx7InZlcnNpb24iOiI3LjEzLjAtZGV2ZWxvcCIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6IiIsImV4cGlyYXRpb24iOiIyMDI2LTAxLTAzVDE2OjA4OjA2LjYyNzM5NzY1NFoiLCJyZWxlYXNlVHlwZSI6ImRldmVsb3AifSx7InZlcnNpb24iOiI3LjEzLjAtcmMuMCIsInNlY3VyaXR5IjpmYWxzZSwiaW5mb1VybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L3JlbGVhc2VzL3RhZy83LjEzLjAtcmMuMCIsImV4cGlyYXRpb24iOiIyMDI2LTAxLTAzVDE2OjA4OjA2LjYyODExMTk4N1oiLCJyZWxlYXNlVHlwZSI6ImNhbmRpZGF0ZSJ9XSwiZXhjZXB0aW9ucyI6e30sImkxOG4iOnsiZW4iOnsidmVyc2lvbl91bnN1cHBvcnRlZF9maW5hbF9kYXlfYm9keSI6IlRoaXMgd29ya3NwYWNlIGlzIHJ1bm5pbmcgYW4gdW5zdXBwb3J0ZWQgdmVyc2lvbiBvZiBSb2NrZXQuQ2hhdC4gWW91ciB3b3Jrc3BhY2UgYWRtaW4gbmVlZHMgdG8gdXBkYXRlIHRvIGF0IGxlYXN0IHZ7e21pbmltdW1TdXBwb3J0ZWRWZXJzaW9ufX0gdG8gcHJldmVudCBjdXRvZmYuIiwidmVyc2lvbl91bnN1cHBvcnRlZF9maW5hbF9kYXlfc3VidGl0bGUiOiJEZXNrdG9wIGFuZCBtb2JpbGUgYXBwIGFjY2VzcyB0byB7e2luc3RhbmNlX2RvbWFpbn19IHdpbGwgYmUgY3V0IG9mZiB0b2RheS4iLCJ2ZXJzaW9uX3Vuc3VwcG9ydGVkX2ZpbmFsX2RheV90aXRsZSI6IldvcmtzcGFjZSB2ZXJzaW9uIHVuc3VwcG9ydGVkIiwidmVyc2lvbl91bnN1cHBvcnRlZF94X2RheXNfcmVtYWluaW5nX2JvZHkiOiJUaGlzIHdvcmtzcGFjZSBpcyBydW5uaW5nIGFuIHVuc3VwcG9ydGVkIHZlcnNpb24gb2YgUm9ja2V0LkNoYXQuIFlvdXIgd29ya3NwYWNlIGFkbWluIG5lZWRzIHRvIHVwZGF0ZSB0byBhdCBsZWFzdCB2e3ttaW5pbXVtU3VwcG9ydGVkVmVyc2lvbn19IHRvIHByZXZlbnQgY3V0b2ZmLiIsInZlcnNpb25fdW5zdXBwb3J0ZWRfeF9kYXlzX3JlbWFpbmluZ19zdWJ0aXRsZSI6IkRlc2t0b3AgYW5kIG1vYmlsZSBhcHAgYWNjZXNzIHRvIHt7aW5zdGFuY2VfZG9tYWlufX0gd2lsbCBiZSBjdXQgb2ZmIGluIHt7cmVtYWluaW5nX2RheXN9fSBkYXkocykuIiwidmVyc2lvbl91bnN1cHBvcnRlZF94X2RheXNfcmVtYWluaW5nX3RpdGxlIjoiV29ya3NwYWNlIHZlcnNpb24gdW5zdXBwb3J0ZWQifSwiZXMiOnsidmVyc2lvbl91bnN1cHBvcnRlZF9maW5hbF9kYXlfYm9keSI6IkVzdGUgd29ya3NwYWNlIGVzdMOhIHVzYW5kbyB1bmEgdmVyc2nDs24gZGUgUm9ja2V0LkNoYXQgcXVlIHlhIG5vIHRpZW5lIHNvcG9ydGUuIFVuIGFkbWluaXN0cmFkb3IgdGllbmUgcXVlIGFjdHVhbGl6YXIgaGFzdGEgdnt7bWluaW11bVN1cHBvcnRlZFZlcnNpb259fSBjb21vIG3DrW5pbW8gcGFyYSBldml0YXIgZGVzY29uZXhpw7NuLiIsInZlcnNpb25fdW5zdXBwb3J0ZWRfZmluYWxfZGF5X3N1YnRpdGxlIjoiRWwgYWNjZXNvIGEgbGFzIGFwbGljYWNpb25lcyBtw7N2aWxlcyB5IGRlIGVzY3JpdG9yaW8gcGFyYSB7e2luc3RhbmNlX2RvbWFpbn19IHNlIGNvcnRhcsOhIGVuIHt7cmVtYWluaW5nX2RheXN9fSBkw61hKHMpLiIsInZlcnNpb25fdW5zdXBwb3J0ZWRfZmluYWxfZGF5X3RpdGxlIjoiVmVyc2nDs24gZGVsIHdvcmtzcGFjZSBubyBzb3BvcnRhZGEiLCJ2ZXJzaW9uX3Vuc3VwcG9ydGVkX3hfZGF5c19yZW1haW5pbmdfYm9keSI6IkVzdGUgd29ya3NwYWNlIGVzdMOhIHVzYW5kbyB1bmEgdmVyc2nDs24gZGUgUm9ja2V0LkNoYXQgcXVlIHlhIG5vIHRpZW5lIHNvcG9ydGUuIFVuIGFkbWluaXN0cmFkb3IgdGllbmUgcXVlIGFjdHVhbGl6YXIgaGFzdGEgdnt7bWluaW11bVN1cHBvcnRlZFZlcnNpb259fSBjb21vIG3DrW5pbW8gcGFyYSBldml0YXIgZGVzY29uZXhpw7NuLiIsInZlcnNpb25fdW5zdXBwb3J0ZWRfeF9kYXlzX3JlbWFpbmluZ19zdWJ0aXRsZSI6IkVsIGFjY2VzbyBhIGxhcyBhcGxpY2FjaW9uZXMgbcOzdmlsZXMgeSBkZSBlc2NyaXRvcmlvIHBhcmEge3tpbnN0YW5jZV9kb21haW59fSBzZSBjb3J0YXLDoSBlbiB7e3JlbWFpbmluZ19kYXlzfX0gZMOtYShzKS4iLCJ2ZXJzaW9uX3Vuc3VwcG9ydGVkX3hfZGF5c19yZW1haW5pbmdfdGl0bGUiOiJWZXJzacOzbiBkZWwgd29ya3NwYWNlIG5vIHNvcG9ydGFkYSJ9LCJwdC1CUiI6eyJ2ZXJzaW9uX3Vuc3VwcG9ydGVkX2ZpbmFsX2RheV9ib2R5IjoiRXN0ZSB3b3Jrc3BhY2UgZXN0w6EgZXhlY3V0YW5kbyB1bWEgdmVyc8OjbyBuw6NvIHN1cG9ydGFkYSBkYSBSb2NrZXQuQ2hhdC4gTyBhZG1pbmlzdHJhZG9yIGRvIHNldSB3b3Jrc3BhY2UgZGV2ZSBhdHVhbGl6YXIgcGVsbyBtZW5vcyBhdMOpIGEgdnt7bWluaW11bVN1cHBvcnRlZFZlcnNpb259fSBwYXJhIGV2aXRhciBvIGNvcnRlLiIsInZlcnNpb25fdW5zdXBwb3J0ZWRfZmluYWxfZGF5X3N1YnRpdGxlIjoiTyBhY2Vzc28gYW9zIGFwbGljYXRpdm9zIGRlc2t0b3AgZSBtb2JpbGUgc2Vyw6EgaW50ZXJyb21waWRvIHBhcmEgbyB7e2luc3RhbmNlX2RvbWFpbn19IGVtIHt7cmVtYWluaW5nX2RheXN9fSBkaWEocykuIiwidmVyc2lvbl91bnN1cHBvcnRlZF9maW5hbF9kYXlfdGl0bGUiOiJWZXJzw6NvIGRvIHdvcmtzcGFjZSBuw6NvIHN1cG9ydGFkYSIsInZlcnNpb25fdW5zdXBwb3J0ZWRfeF9kYXlzX3JlbWFpbmluZ19ib2R5IjoiRXN0ZSB3b3Jrc3BhY2UgZXN0w6EgZXhlY3V0YW5kbyB1bWEgdmVyc8OjbyBuw6NvIHN1cG9ydGFkYSBkYSBSb2NrZXQuQ2hhdC4gTyBhZG1pbmlzdHJhZG9yIGRvIHNldSB3b3Jrc3BhY2UgZGV2ZSBhdHVhbGl6YXIgcGVsbyBtZW5vcyBhdMOpIGEgdnt7bWluaW11bVN1cHBvcnRlZFZlcnNpb259fSBwYXJhIGV2aXRhciBvIGNvcnRlLiAiLCJ2ZXJzaW9uX3Vuc3VwcG9ydGVkX3hfZGF5c19yZW1haW5pbmdfc3VidGl0bGUiOiJPIGFjZXNzbyBhb3MgYXBsaWNhdGl2b3MgZGVza3RvcCBlIG1vYmlsZSBzZXLDoSBpbnRlcnJvbXBpZG8gcGFyYSBvIHt7aW5zdGFuY2VfZG9tYWlufX0gZW0ge3tyZW1haW5pbmdfZGF5c319IGRpYShzKS4iLCJ2ZXJzaW9uX3Vuc3VwcG9ydGVkX3hfZGF5c19yZW1haW5pbmdfdGl0bGUiOiJWZXJzw6NvIGRvIHdvcmtzcGFjZSBuw6NvIHN1cG9ydGFkYSJ9fSwiZW5mb3JjZW1lbnRTdGFydERhdGUiOiIyMDIzLTEyLTE1VDAwOjAwOjAwWiJ9.FwjZyscJnh3ID1AcrVPhuh-IMVppO3CHv6tiJGZbvvhAwEdD-IJd4cptrHuTiMXFvQXtGtuTs4OgKxmq79tmLHDDxfQ0mmOfpk-wPAFP57vNvJUoi_mjy-NfPFU5Q4vn3A0PZHNHBqvt09fvkUcmZTcguqDPsu4SuwrTsmEGdJxbl54a2cojCHEc-MF_jyfJzhtGCYZqwX_ccBiWsT47lVwkdTDPli8LDb3AoDNuXqNz2M-H7dRKVnAk5w199RmIFDJ9c9Zj5U93E6_UNDZBi9S-O3Ki38G_OPV5hVDGkbOmbpCLQd7oNTXVliCIIRW3THhRnCmzMSnTq28OXkraUQ',
					timestamp: '2025-11-27T16:08:06.623860433Z',
					messages: [
						{
							remainingDays: 15,
							title: 'version_unsupported_x_days_remaining_title',
							subtitle: 'version_unsupported_x_days_remaining_subtitle',
							description: 'version_unsupported_x_days_remaining_body',
							type: 'info',
							params: { minimumSupportedVersion: '7.7.0' },
							link: '',
						},
						{
							remainingDays: 1,
							title: 'version_unsupported_final_day_remaining_title',
							subtitle: 'version_unsupported_final_day_subtitle',
							description: 'version_unsupported_final_day_body',
							type: 'info',
							params: { minimumSupportedVersion: '7.7.0' },
							link: '',
						},
					],
					versions: [
						{
							version: '7.12.2',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.12.2',
							expiration: '2026-05-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.9.3',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.9.3',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.6.0',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.6.0',
							expiration: '2025-11-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.6.1',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.6.1',
							expiration: '2025-11-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.6.2',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.6.2',
							expiration: '2025-11-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.6.3',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.6.3',
							expiration: '2025-11-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.6.4',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.6.4',
							expiration: '2025-11-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.6.5',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.6.5',
							expiration: '2025-11-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.6.6',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.6.6',
							expiration: '2025-11-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.7.0',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.7.0',
							expiration: '2025-12-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.7.1',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.7.1',
							expiration: '2025-12-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.7.3',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.7.3',
							expiration: '2025-12-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.7.4',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.7.4',
							expiration: '2025-12-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.7.5',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.7.5',
							expiration: '2025-12-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.7.6',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.7.6',
							expiration: '2025-12-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.7.7',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.7.7',
							expiration: '2025-12-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.7.8',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.7.8',
							expiration: '2025-12-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.7.9',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.7.9',
							expiration: '2025-12-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.8.0',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.8.0',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.8.1',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.8.1',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.8.2',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.8.2',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.8.3',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.8.3',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.9.0',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.9.0',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.9.1',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.9.1',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.8.4',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.8.4',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.9.4',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.9.4',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.9.5',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.9.5',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.9.6',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.9.6',
							expiration: '2026-01-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.11.0',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.11.0',
							expiration: '2026-04-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.11.1',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.11.1',
							expiration: '2026-04-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.11.2',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.11.2',
							expiration: '2026-04-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.12.0',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.12.0',
							expiration: '2026-05-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.12.1',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.12.1',
							expiration: '2026-05-31T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.10.0',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.10.0',
							expiration: '2026-06-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.10.1',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.10.1',
							expiration: '2026-06-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.10.2',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.10.2',
							expiration: '2026-06-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.10.3',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.10.3',
							expiration: '2026-06-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.10.4',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.10.4',
							expiration: '2026-06-30T23:59:59.999Z',
							releaseType: 'stable',
						},
						{
							version: '7.13.0-develop',
							security: false,
							infoUrl: '',
							expiration: '2026-01-03T16:08:06.627397654Z',
							releaseType: 'develop',
						},
						{
							version: '7.13.0-rc.0',
							security: false,
							infoUrl: 'https://github.com/RocketChat/Rocket.Chat/releases/tag/7.13.0-rc.0',
							expiration: '2026-01-03T16:08:06.628111987Z',
							releaseType: 'candidate',
						},
					],
					exceptions: {},
					i18n: {
						'en': {
							version_unsupported_final_day_body:
								'This workspace is running an unsupported version of Rocket.Chat. Your workspace admin needs to update to at least v{{minimumSupportedVersion}} to prevent cutoff.',
							version_unsupported_final_day_subtitle: 'Desktop and mobile app access to {{instance_domain}} will be cut off today.',
							version_unsupported_final_day_title: 'Workspace version unsupported',
							version_unsupported_x_days_remaining_body:
								'This workspace is running an unsupported version of Rocket.Chat. Your workspace admin needs to update to at least v{{minimumSupportedVersion}} to prevent cutoff.',
							version_unsupported_x_days_remaining_subtitle:
								'Desktop and mobile app access to {{instance_domain}} will be cut off in {{remaining_days}} day(s).',
							version_unsupported_x_days_remaining_title: 'Workspace version unsupported',
						},
						'es': {
							version_unsupported_final_day_body:
								'Este workspace está usando una versión de Rocket.Chat que ya no tiene soporte. Un administrador tiene que actualizar hasta v{{minimumSupportedVersion}} como mínimo para evitar desconexión.',
							version_unsupported_final_day_subtitle:
								'El acceso a las aplicaciones móviles y de escritorio para {{instance_domain}} se cortará en {{remaining_days}} día(s).',
							version_unsupported_final_day_title: 'Versión del workspace no soportada',
							version_unsupported_x_days_remaining_body:
								'Este workspace está usando una versión de Rocket.Chat que ya no tiene soporte. Un administrador tiene que actualizar hasta v{{minimumSupportedVersion}} como mínimo para evitar desconexión.',
							version_unsupported_x_days_remaining_subtitle:
								'El acceso a las aplicaciones móviles y de escritorio para {{instance_domain}} se cortará en {{remaining_days}} día(s).',
							version_unsupported_x_days_remaining_title: 'Versión del workspace no soportada',
						},
						'pt-BR': {
							version_unsupported_final_day_body:
								'Este workspace está executando uma versão não suportada da Rocket.Chat. O administrador do seu workspace deve atualizar pelo menos até a v{{minimumSupportedVersion}} para evitar o corte.',
							version_unsupported_final_day_subtitle:
								'O acesso aos aplicativos desktop e mobile será interrompido para o {{instance_domain}} em {{remaining_days}} dia(s).',
							version_unsupported_final_day_title: 'Versão do workspace não suportada',
							version_unsupported_x_days_remaining_body:
								'Este workspace está executando uma versão não suportada da Rocket.Chat. O administrador do seu workspace deve atualizar pelo menos até a v{{minimumSupportedVersion}} para evitar o corte. ',
							version_unsupported_x_days_remaining_subtitle:
								'O acesso aos aplicativos desktop e mobile será interrompido para o {{instance_domain}} em {{remaining_days}} dia(s).',
							version_unsupported_x_days_remaining_title: 'Versão do workspace não suportada',
						},
					},
					enforcementStartDate: '2023-12-15T00:00:00Z',
				})}`,
				path: `${file.getPathInPackage()}.js`,
			});
		};

		const processFile = async function (file) {
			let output = JSON.parse(file.getContentsAsString());
			output.build = {
				date: new Date().toISOString(),
				nodeVersion: process.version,
				arch: process.arch,
				platform: process.platform,
				osRelease: os.release(),
				totalMemory: os.totalmem(),
				freeMemory: os.freemem(),
				cpus: os.cpus().length,
			};

			output.marketplaceApiVersion = require('@rocket.chat/apps-engine/package.json').version.replace(/^[^0-9]/g, '');
			const minimumClientVersions =
				JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './package.json'), { encoding: 'utf8' }))?.rocketchat
					?.minimumClientVersions || {};
			try {
				const result = await execAsync("git log --pretty=format:'%H%n%ad%n%an%n%s' -n 1");
				const data = result.stdout.split('\n');
				output.commit = {
					hash: data.shift(),
					date: data.shift(),
					author: data.shift(),
					subject: data.join('\n'),
				};
			} catch (e) {
				if (process.env.NODE_ENV !== 'development') {
					throw e;
				}
				// no git
			}

			try {
				const tags = await execAsync('git describe --abbrev=0 --tags');
				if (output.commit) {
					output.commit.tag = tags.stdout.replace('\n', '');
				}
			} catch (e) {
				// no tags
			}

			try {
				const branch = await execAsync('git rev-parse --abbrev-ref HEAD');
				if (output.commit) {
					output.commit.branch = branch.stdout.replace('\n', '');
				}
			} catch (e) {
				if (process.env.NODE_ENV !== 'development') {
					throw e;
				}

				// no branch
			}

			file.addJavaScript({
				data: `exports.Info = ${JSON.stringify(output, null, 4)};
				exports.minimumClientVersions = ${JSON.stringify(minimumClientVersions, null, 4)};`,
				path: `${file.getPathInPackage()}.js`,
			});
		};

		for await (const file of files) {
			console.log('Processing file', file.getDisplayPath());
			switch (true) {
				case file.getDisplayPath().endsWith('rocketchat.info'): {
					await processFile(file);
					break;
				}
				case file.getDisplayPath().endsWith('rocketchat-supported-versions.info'): {
					if (process.env.NODE_ENV === 'development') {
						file.addJavaScript({
							data: `exports.supportedVersions = {}`,
							path: `${file.getPathInPackage()}.js`,
						});
						break;
					}
					await processVersionFile(file);
					break;
				}
				default: {
					throw new Error(`Unexpected file ${file.getDisplayPath()}`);
				}
			}
			console.log('Processed file', file.getDisplayPath());
		}
	}
}

Plugin.registerCompiler(
	{
		extensions: ['info'],
	},
	function () {
		return new VersionCompiler();
	},
);
