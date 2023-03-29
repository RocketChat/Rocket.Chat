/* eslint-disable no-undef */
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Karl STEIN
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import fs from 'fs';

import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import Future from 'fibers/future';

import { UploadFS } from '.';
import { Tokens } from './ufs-tokens';

Meteor.methods({
	/**
	 * Completes the file transfer
	 * @param fileId
	 * @param storeName
	 * @param token
	 */
	ufsComplete(fileId, storeName, token) {
		check(fileId, String);
		check(storeName, String);
		check(token, String);

		// Get store
		const store = UploadFS.getStore(storeName);
		if (!store) {
			throw new Meteor.Error('invalid-store', 'Store not found');
		}
		// Check token
		if (!store.checkToken(token, fileId)) {
			throw new Meteor.Error('invalid-token', 'Token is not valid');
		}

		const fut = new Future();
		const tmpFile = UploadFS.getTempFilePath(fileId);

		const removeTempFile = function () {
			fs.stat(tmpFile, (err) => {
				!err &&
					fs.unlink(tmpFile, (err2) => {
						err2 && console.error(`ufs: cannot delete temp file "${tmpFile}" (${err2.message})`);
					});
			});
		};

		try {
			// todo check if temp file exists

			// Get file
			const file = store.getCollection().findOne({ _id: fileId });

			// Validate file before moving to the store
			store.validate(file);

			// Get the temp file
			const rs = fs.createReadStream(tmpFile, {
				flags: 'r',
				encoding: null,
				autoClose: true,
			});

			// Clean upload if error occurs
			rs.on(
				'error',
				Meteor.bindEnvironment(function (err) {
					console.error(err);
					store.getCollection().remove({ _id: fileId });
					fut.throw(err);
				}),
			);

			// Save file in the store
			store.write(
				rs,
				fileId,
				Meteor.bindEnvironment(function (err, file) {
					removeTempFile();

					if (err) {
						fut.throw(err);
					} else {
						// File has been fully uploaded
						// so we don't need to keep the token anymore.
						// Also this ensure that the file cannot be modified with extra chunks later.
						Tokens.remove({ fileId });
						fut.return(file);
					}
				}),
			);

			// catch will not work if fut.wait() is outside try/catch
			return fut.wait();
		} catch (err) {
			// If write failed, remove the file
			store.getCollection().remove({ _id: fileId });
			// removeTempFile(); // todo remove temp file on error or try again ?
			throw new Meteor.Error('ufs: cannot upload file', err);
		}
	},
});
