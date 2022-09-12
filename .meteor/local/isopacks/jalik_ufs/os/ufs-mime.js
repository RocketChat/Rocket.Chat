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

/**
 * MIME types and extensions
 */
export const MIME = {
	// application
	'7z': 'application/x-7z-compressed',
	'arc': 'application/octet-stream',
	'ai': 'application/postscript',
	'bin': 'application/octet-stream',
	'bz': 'application/x-bzip',
	'bz2': 'application/x-bzip2',
	'eps': 'application/postscript',
	'exe': 'application/octet-stream',
	'gz': 'application/x-gzip',
	'gzip': 'application/x-gzip',
	'js': 'application/javascript',
	'json': 'application/json',
	'ogx': 'application/ogg',
	'pdf': 'application/pdf',
	'ps': 'application/postscript',
	'psd': 'application/octet-stream',
	'rar': 'application/x-rar-compressed',
	'rev': 'application/x-rar-compressed',
	'swf': 'application/x-shockwave-flash',
	'tar': 'application/x-tar',
	'xhtml': 'application/xhtml+xml',
	'xml': 'application/xml',
	'zip': 'application/zip',

	// audio
	'aif': 'audio/aiff',
	'aifc': 'audio/aiff',
	'aiff': 'audio/aiff',
	'au': 'audio/basic',
	'flac': 'audio/flac',
	'midi': 'audio/midi',
	'mp2': 'audio/mpeg',
	'mp3': 'audio/mpeg',
	'mpa': 'audio/mpeg',
	'oga': 'audio/ogg',
	'ogg': 'audio/ogg',
	'opus': 'audio/ogg',
	'ra': 'audio/vnd.rn-realaudio',
	'spx': 'audio/ogg',
	'wav': 'audio/x-wav',
	'weba': 'audio/webm',
	'wma': 'audio/x-ms-wma',

	// image
	'avs': 'image/avs-video',
	'bmp': 'image/x-windows-bmp',
	'gif': 'image/gif',
	'ico': 'image/vnd.microsoft.icon',
	'jpeg': 'image/jpeg',
	'jpg': 'image/jpg',
	'mjpg': 'image/x-motion-jpeg',
	'pic': 'image/pic',
	'png': 'image/png',
	'svg': 'image/svg+xml',
	'tif': 'image/tiff',
	'tiff': 'image/tiff',

	// text
	'css': 'text/css',
	'csv': 'text/csv',
	'html': 'text/html',
	'txt': 'text/plain',

	// video
	'avi': 'video/avi',
	'dv': 'video/x-dv',
	'flv': 'video/x-flv',
	'mov': 'video/quicktime',
	'mp4': 'video/mp4',
	'mpeg': 'video/mpeg',
	'mpg': 'video/mpg',
	'ogv': 'video/ogg',
	'vdo': 'video/vdo',
	'webm': 'video/webm',
	'wmv': 'video/x-ms-wmv',

	// specific to vendors
	'doc': 'application/msword',
	'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'odb': 'application/vnd.oasis.opendocument.database',
	'odc': 'application/vnd.oasis.opendocument.chart',
	'odf': 'application/vnd.oasis.opendocument.formula',
	'odg': 'application/vnd.oasis.opendocument.graphics',
	'odi': 'application/vnd.oasis.opendocument.image',
	'odm': 'application/vnd.oasis.opendocument.text-master',
	'odp': 'application/vnd.oasis.opendocument.presentation',
	'ods': 'application/vnd.oasis.opendocument.spreadsheet',
	'odt': 'application/vnd.oasis.opendocument.text',
	'otg': 'application/vnd.oasis.opendocument.graphics-template',
	'otp': 'application/vnd.oasis.opendocument.presentation-template',
	'ots': 'application/vnd.oasis.opendocument.spreadsheet-template',
	'ott': 'application/vnd.oasis.opendocument.text-template',
	'ppt': 'application/vnd.ms-powerpoint',
	'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'xls': 'application/vnd.ms-excel',
	'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
