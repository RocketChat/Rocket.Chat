# UploadFS

**WARNING: This package will not receive any new features, only bug fixing when possible. The reason is that the Meteor package system is kind of obsolete now. I (the author of the package) plan to release a package on NPM that would work with other frameworks than Meteor, so it will be a full rewriting of UploadFS but with a completely different name. Thank you for your comprehension.** 



UploadFS is a package for the Meteor framework that aims to make file uploading easy, fast and configurable.
Some important features are supported like the ability to **start, stop or even abort a transfer**, securing file access, transforming files on writing or reading...

If you want to support this package and feel graceful for all the work, please share this package with the community or feel free to send me pull requests if you want to contribute.

Also I'll be glad to receive donations, whatever you give it will be much appreciated.

If you find this lib useful and would like to contribute to it's development or just thank me (the author), donations are welcome.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=SS78MUMW8AH4N)

## Installation

To install the package, execute this command in the root of your project :
```
meteor add jalik:ufs
```

If later you want to remove the package :
```
meteor remove jalik:ufs
```

## Plugins

In this documentation, I am using the `UploadFS.store.Local` store which saves files on the filesystem.
But since the package is modular, you can install other stores or even create your own store.

* [UploadFS.store.Local](https://github.com/jalik/jalik-ufs-local)
* [UploadFS.store.GridFS](https://github.com/jalik/jalik-ufs-gridfs)
* [UploadFS.store.WABS](https://github.com/sebakerckhof/ufs-wabs)
* [UploadFS.store.S3](https://github.com/sebakerckhof/ufs-s3)
* [AutoForm-UFS](https://github.com/DesignmanIO/meteor-autoform-ufs)

## Testing

You can test the package by downloading and running [UFS-Example](https://github.com/jalik/ufs-example) which is simple demo of UploadFS.

## Mobile Testing

In order to test on mobile builds, `ROOT_URL` and `--mobile-server` must be set to your computer's local IP address and port:

```bash
export ROOT_URL=http://192.168.1.7:3000 && meteor run android-device --mobile-server=http://192.168.1.7:3000
```

## Configuration

You can access and modify settings via `UploadFS.config`.

```js
import {UploadFS} from 'meteor/jalik:ufs';

// Set default permissions for all stores (you can later overwrite the default permissions on each store)
UploadFS.config.defaultStorePermissions = new UploadFS.StorePermissions({
    insert(userId, doc) {
        return userId;
    },
    update(userId, doc) {
        return userId === doc.userId;
    },
    remove(userId, doc) {
        return userId === doc.userId;
    }
});

// Use HTTPS in URLs
UploadFS.config.https = true;

// Activate simulation for slowing file reading
UploadFS.config.simulateReadDelay = 1000; // 1 sec

// Activate simulation for slowing file uploading
UploadFS.config.simulateUploadSpeed = 128000; // 128kb/s

// Activate simulation for slowing file writing
UploadFS.config.simulateWriteDelay = 2000; // 2 sec

// This path will be appended to the site URL, be sure to not put a "/" as first character
// for example, a PNG file with the _id 12345 in the "photos" store will be available via this URL :
// http://www.yourdomain.com/uploads/photos/12345.png
UploadFS.config.storesPath = 'uploads';

// Set the temporary directory where uploading files will be saved
// before sent to the store.
UploadFS.config.tmpDir = '/tmp/uploads';

// Set the temporary directory permissions.
UploadFS.config.tmpDirPermissions = '0700';
```

## Creating a Store (server)

**Since v0.6.7, you can share your store between client and server or define it on the server only.**
**Before v0.6.7, a store must be available on the client and the server.**

A store is the place where your files are saved, it could be your local hard drive or a distant cloud hosting solution.
Let say you have a `Photos` collection which is used to save the files info.

You need to create the store that will will contains the data of the `Photos` collection.
Note that the `name` of the store must be unique. In the following example we are using a local filesystem store.
Each store has its own options, so refer to the store documentation to see available options.

```js
import {Mongo} from 'meteor/mongo';
import {LocalStore} from 'meteor/jalik:ufs-local';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos'
});
```

## Filtering uploads (server)

### Filtering before uploading
You can filter uploads by assigning a `UploadFS.Filter` to a store.
The filter is tested before inserting a file in the collection.
If the file does not match the filter, it won't be inserted and will not be uploaded.

### Filtering after uploading
When the file is fully uploaded to the server, it's still in a temporary location.
At this moment you can validate the uploaded file before writing it to the store.
To do this, use `onValidate` option in the store options.

The following example shows a complete validation (before and after upload).

```js
import {Mongo} from 'meteor/mongo';
import {LocalStore} from 'meteor/jalik:ufs-local';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos',
    // Apply a filter to restrict file upload
    filter: new UploadFS.Filter({
        minSize: 1,
        maxSize: 1024 * 1000, // 1MB,
        contentTypes: ['image/*'],
        extensions: ['jpg', 'png']
    }),
    // Make sure that gallery pictures are indeed images
    onValidate: function (file) {
        // Here 'file' contains file metadata sent by the client, we need to get
        // the disk path to the uploaded temp file to give it to gm.
        const tempFilePath = UploadFS.getTempFilePath(file._id);
        
        // Since the 'identify' function below is executed in a callback,
        // we cannot directly throw an exception from it, because the exception would
        // be catched by the server and not by ufs. We need to throw the exception
        // from this onValidate function, so that ufs can catch the exception and
        // trigger the cleanup process/report the error to the client.
        // We do this by defining a future and waiting for it in onValidate, and having
        // the future throw the exception instead of throwing it directly from
        // the 'identify' function.
        let future = new Future();
        
        // identify will return an error if the content of the file is not an image.
        // If it is an image, then details on the image file will be in data.
        const identify = function (err, data) {
            if (err) {
                // Throw an exception to inform the client and trigger the cleanup process
                future.throw(new Meteor.Error('not-an-image', 'The file is not an image'));
            } else {
                // We need to tell our future to return, or else it would stay stuck.
                future.return();
            }
        };
        gm(tempFilePath).identify(identify);
        
        // Wait for 'identify' to complete, and either return or throw the exception
        return future.wait();
    }
});
```

If you need a more advanced filter, you can pass your own method using the `onCheck` option.

```js
import {Mongo} from 'meteor/mongo';
import {LocalStore} from 'meteor/jalik:ufs-local';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos',
    // Apply a filter to restrict file upload
    filter: new UploadFS.Filter({
        onCheck: function(file) {
            if (file.extension !== 'png') {
                return false;
            }
            return true;
        }
    })
});
```

## Transforming files (server)

If you need to modify the file before saving it to the store, you can to use the `transformWrite` option.
If you want to modify the file before returning it (for display), then use the `transformRead` option.
A common use is to resize/compress images to optimize the uploaded files.

**NOTE: Do not forget to install the required libs on your system with NPM (GM, ImageMagick, GraphicsMagicK or whatever you are using).**

```js
import gm from 'gm';
import {LocalStore} from 'meteor/jalik:ufs-local';
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos',
    // Transform file when reading
    transformRead(from, to, fileId, file, request) {
        from.pipe(to); // this returns the raw data
    },
    // Transform file when writing
    transformWrite(from, to, fileId, file) {
        let gm = Npm.require('gm');
        if (gm) {
            gm(from)
                .resize(400, 400)
                .gravity('Center')
                .extent(400, 400)
                .quality(75)
                .stream().pipe(to);
        } else {
            console.error("gm is not available", file);
        }
    }
});
```

## Copying files (since v0.3.6) (server)

You can copy files to other stores on the fly, it could be for backup or just to have alternative versions of the same file (eg: thumbnails).
To copy files that are saved in a store, use the `copyTo` option, you just need to pass an array of stores to copy to.

```js
import gm from 'gm';
import {LocalStore} from 'meteor/jalik:ufs-local';
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Files = new Mongo.Collection('files');
const Thumbnails128 = new Mongo.Collection('thumbnails-128');
const Thumbnails64 = new Mongo.Collection('thumbnails-64');

const Thumbnail128Store = new LocalStore({
    collection: Thumbnails128,
    name: 'thumbnails-128',
    path: '/uploads/thumbnails/128x128',
    transformWrite: function(readStream, writeStream, fileId, file) {
        let gm = Npm.require('gm');
        if (gm) {
            gm(from)
                .resize(128, 128)
                .gravity('Center')
                .extent(128, 128)
                .quality(75)
                .stream().pipe(to);
        } else {
            console.error("gm is not available", file);
        }
    }
});

const Thumbnail64Store = new LocalStore({
    collection: Thumbnails64,
    name: 'thumbnails-64',
    path: '/uploads/thumbnails/64x64',
    transformWrite: function(readStream, writeStream, fileId, file) {
        let gm = Npm.require('gm');
        if (gm) {
            gm(from)
                .resize(64, 64)
                .gravity('Center')
                .extent(64, 64)
                .quality(75)
                .stream().pipe(to);
        } else {
            console.error("gm is not available", file);
        }
    }
});

const FileStore = new LocalStore({
    collection: Files,
    name: 'files',
    path: '/uploads/files',
    copyTo: [
        Thumbnail128Store,
        Thumbnail64Store
    ]
});
```

You can also manually copy a file to another store by using the `copy()` method.

```js
import {Mongo} from 'meteor/mongo';
import {LocalStore} from 'meteor/jalik:ufs-local';
import {UploadFS} from 'meteor/jalik:ufs';

const Backups = new Mongo.Collection('backups');
const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos'
});

const BackupStore = new LocalStore({
    collection: Backups,
    name: 'backups',
    path: '/backups'
});

PhotoStore.copy(fileId, BackupStore, function(err, copyId, copyFile) {
    !err && console.log(fileId + ' has been copied as ' + copyId);
});
```

Or you can save the thumbnails URL into the original file, it's the recommended way to do it since it's embedded in the original file, you don't need to manage thumbnails subscriptions :

```js
Thumbnails128Store.onFinishUpload = function(file) {
    Files.update({_id: file.originalId}, {$set: {thumb128Url: file.url}});
};
Thumbnails64Store.onFinishUpload = function(file) {
    Files.update({_id: file.originalId}, {$set: {thumb64Url: file.url}});
};
```

## Validating files (since v0.7.2) (server)

Before writing file to a store, you can validate the uploaded file, like checking with `gm` if the uploaded file is really an image.

```js
import gm from 'gm';
import {LocalStore} from 'meteor/jalik:ufs-local';
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Images = new Mongo.Collection('files');

const ImageStore = new LocalStore({
    collection: Images,
    name: 'images',
    path: '/uploads/images',
    // Make sure that pictures are indeed images
    transformWrite: function (from, to, fileId, file) {
        let stream = null;
        // identify will return an error if the content of the file is not an image.
        // If it is an image, then details on the image file will be in data.
        const identify = function(err, data) {
            if (err) {
                // Causes an exception and triggers the cleanup process by sending
                // an error event to the 'to' stream
                to.emit('error', new Meteor.Error('invalid-file', 'The file is not an image'));
            } else {
                // Save the uploaded picture, after cleaning it.
                gm(stream)
                .autoOrient()
                .noProfile()
                .stream()
                .pipe(to);
            }
        };
        stream = gm(from).identify(identify).stream();
    }
});
```

## Setting permissions (server)

If you don't want anyone to do anything, you must define permission rules.
By default, there is no restriction (except the filter) on insert, remove and update actions.

**The permission system has changed since `v0.6.1`, you must define permissions like this :**

```js
import {LocalStore} from 'meteor/jalik:ufs-local';
import {UploadFS} from 'meteor/jalik:ufs';

PhotoStore.setPermissions(new UploadFS.StorePermissions({
    insert(userId, doc) {
        return userId;
    },
    update(userId, doc) {
        return userId === doc.userId;
    },
    remove(userId, doc) {
        return userId === doc.userId;
    }
}));
```

or when you create the store :

```js
import {LocalStore} from 'meteor/jalik:ufs-local';
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos',
    permissions: new UploadFS.StorePermissions({
        insert(userId, doc) {
            return userId;
        },
        update(userId, doc) {
            return userId === doc.userId;
        },
        remove(userId, doc) {
            return userId === doc.userId;
        }
    })
});
```

or you can set default permissions for all stores (since v0.7.1) :

```js
import {UploadFS} from 'meteor/jalik:ufs';

UploadFS.config.defaultStorePermissions = new UploadFS.StorePermissions({
    insert(userId, doc) {
        return userId;
    },
    update(userId, doc) {
        return userId === doc.userId;
    },
    remove(userId, doc) {
        return userId === doc.userId;
    }
});
```

## Securing file access (server)

When returning the file for a HTTP request, you can do some checks to decide whether or not the file should be sent to the client.
This is done by defining the `onRead()` method on the store.

**Note:** Since v0.3.5, every file has a token attribute when its transfer is complete, this token can be used as a password to access/display the file. Just be sure to not publish it if not needed. You can also change this token whenever you want making older links to be staled.

```html
{{#with image}}
<a href="{{url}}?token={{token}}">
    <img src="{{url}}?token={{token}}">
</a>
{{/with}}
```

```js
import {LocalStore} from 'meteor/jalik:ufs-local';
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos',
    onRead(fileId, file, request, response) {
        // Allow file access if not private or if token is correct
        if (file.isPublic || request.query.token === file.token) {
            return true;
        } else {
            response.writeHead(403);
            return false;
        }
    }
});
```

## Handling store events and errors (client/server)

Some events are triggered to allow you to do something at the right moment on server side.

```js
import {LocalStore} from 'meteor/jalik:ufs-local';
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos',
    // Called when file has been uploaded
    onFinishUpload(file) {
        console.log(file.name + ' has been uploaded');
    },
    // Called when a copy error happened
    onCopyError(err, fileId, file) {
        console.error('Cannot create copy ' + file.name);
    },
    // Called when a read error happened
    onReadError(err, fileId, file) {
        console.error('Cannot read ' + file.name);
    },
    // Called when a write error happened
    onWriteError(err, fileId, file) {
        console.error('Cannot write ' + file.name);
    }
});
```

## Reading a file from a store (server)

If you need to get a file directly from a store, do like below :

```js
import {LocalStore} from 'meteor/jalik:ufs-local';
import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos'
});

// Get the file from database
let file = Photos.findOne({_id: fileId});

// Get the file stream from the store
let readStream = PhotoStore.getReadStream(fileId, file);

readStream.on('error', Meteor.bindEnvironment(function (error) {
    console.error(err);
}));
readStream.on('data', Meteor.bindEnvironment(function (data) {
    // handle the data
}));
```

## Writing a file to a store (server)

If you need to save a file directly to a store, do like below :

```js
// Insert the file in database
let fileId = store.create(file);

// Save the file to the store
store.write(stream, fileId, function(err, file) {
    if (err) {
        console.error(err);
    }else {
        console.log('file saved to store');
    }
});
```

## Uploading files

### Uploading from a local file (client)

When the store on the server is configured, you can upload files to it.

And there the code to upload the selected files :

```js
import {LocalStore} from 'meteor/jalik:ufs-local';
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos'
});
```

Notice : You can use `UploadFS.selectFile(callback)` or `UploadFS.selectFiles(callback)` to select one or multiple files,
the callback is called with one argument that represents the File/Blob object for each selected file.

During uploading you can get some kind of useful information like the following :
 - `uploader.getAverageSpeed()` returns the average speed in bytes per second
 - `uploader.getElapsedTime()` returns the elapsed time in milliseconds
 - `uploader.getRemainingTime()` returns the remaining time in milliseconds
 - `uploader.getSpeed()` returns the speed in bytes per second

### Importing file from a URL (server)

You can import a file from an absolute URL by using one of the following methods :

```js
import {LocalStore} from 'meteor/jalik:ufs-local';
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos'
});

let url = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';
let attr = { name: 'Google Logo', description: 'Logo from www.google.com' };

// You can import directly from the store instance
PhotoStore.importFromURL(url, attr, function (err, file) {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Photo saved :', file);
    }
});

// Or using the common UFS method (requires the store name)
UploadFS.importFromURL(url, attr, storeName, callback);
```

**WARNING:** File type detection is based on the file name in the URL so if the URL is obfuscated it won't work (http://www.hello.com/images/123456 won't work, http://www.hello.com/images/123456.png will work).

**NOTE:** since v0.6.8, all imported files have the `originalUrl` attribute, this allows to know where the file comes from and also to do some checks before inserting the file with the `StorePermissions.insert`.

```js
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new UploadFS.Store.Local({
    name: 'photos',
    collection: Photos,
    permissions: new UploadFS.StorePermissions({
        insert: function(userId, file) {
            // Check if the file is imported from a URL
            if (typeof file.originalUrl === 'string') {
                // allow or not by doing some checks
            }
        }
    })
});
```

### Removing files

To remove a file, simply delete it from the collection (database) and the physical file will be automatically removed from the store wherever it is (in the cloud, on the filesystem, in database...) :

```js
import {LocalStore} from 'meteor/jalik:ufs-local';
import {Mongo} from 'meteor/mongo';
import {UploadFS} from 'meteor/jalik:ufs';

const Photos = new Mongo.Collection('photos');

const PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos'
});

// Removes the file in database and in the store
Photos.remove({_id: "1d5Fh6J4LMxPO"});
```

## Setting MIME types (server)

**NOTE: only available since v0.6.9**

UploadFS automatically detects common MIME types based on the file extension.
So when uploading a file, if the `file.type` is not set, UploadFS will check in its MIME list and assign the corresponding MIME,
you can also add your own MIME types.

```js
import {UploadFS} from 'meteor/jalik:ufs';

// Adds KML and KMZ MIME types detection
UploadFS.addMimeType('kml', 'application/vnd.google-earth.kml+xml');
UploadFS.addMimeType('kmz', 'application/vnd.google-earth.kmz');
```

If you want to get all MIME types :
```js
import {UploadFS} from 'meteor/jalik:ufs';

const MIME = UploadFS.getMimeTypes();
```

## Displaying images (client)

To display a file, simply use the `url` attribute for an absolute URL or the `path` attribute for a relative URL.

**NOTE: `path` is only available since v0.6.8**

You can upgrade existing documents to add the `path` attribute by calling the `UploadFS.addPathAttributeToFiles(where)`
which will upgrade all collections linked to any UploadFS store, the `where` option is not required, default predicate is `{path: null}`.

## Changelog

### Version 1.0.2
- Fixes "Invalid file name" error on client upload when passing File Blob

### Version 1.0.1
- Updates to matb33:collection-hooks@1.0.1

### Version 1.0.0
- Updates to Meteor 1.9
- Removes Blaze template helpers

### Version 0.7.5
- Fixes `UploadFS.config.https` not being used (since `v0.7.3`)
- Calls store's `onFinishUpload((file) => {})` method before updating the file, so you can modify the file document (metadata like name, description...)

### Version 0.7.4_1
- Fixes file selection input visible in Safari

### Version 0.7.4
**Security fix, please upgrade as soon as possible**
- Fixes store callback events not being called : `onCopyError`, `onFinishUpload`, `onRead`, `onReadError`, `onWriteError`
- Adds method `UploadFS.addStore(store)`

### Version 0.7.3
- Bypasses collection permissions check when calling version upgrade methods

### Version 0.7.2
- Fixes file path/url when app is in a subfolder (#104)
- Adds attribute `etag` to uploaded files
- Adds HTTP cache support : return HTTP code `304` depending of `Last-Modified` and `If-None-Match` request headers (#110)
- Adds option `Store.onValidate(file)` to validate a file before writing to the store (#109)
- Adds method `UploadFS.addETagAttributeToFiles(where)` to add `etag` attribute to existing files
- Adds method `UploadFS.generateEtag()`
- Adds method `Store.validate(file)`
- Uses ES6 class syntax
- Uses ES6 import syntax

**NOTE:** To add `etag` attribute to existing files, call once the method `UploadFS.addETagAttributeToFiles({etag: null});`

**NOTE 2:** If your `ROOT_URL` env var is pointing to a subfolder like http://localhost/myapp, please call this method once `UploadFS.addPathAttributeToFiles({});`

### Version 0.7.1
- Adds default store permissions in `UploadFS.config.defaultStorePermissions`
- Fixes store permissions (#95)
- Fixes HTTP `Range` result from stream (#94) : works with ufs-local and ufs-gridfs

### Version 0.7.0_2
- Adds support for `Range` request headers (to seek audio/video files)
- Upgrades dependencies

### Version 0.6.9
- Adds ufs-mime.js file to handle mime related operations
- Sets default file type to "application/octet-stream"
- Detects automatically MIME type by checking file extension on upload (#84)
- Fixes error thrown by UploadFS.Filter.checkContentType() when file type is empty
- Fixes check(file, Object); into "ufsImportURL" method

### Version 0.6.8

- Passes full predicate in CRUD operations instead of just the ID
- Removes file tokens when file is uploaded or removed
- Adds the "originalUrl" attribute to files imported from URLs
- Adds the "path" attribute to uploaded files corresponding to the relative URL of the file
- Adds UploadFS.Store.prototype.getRelativeURL(path) to get the relative URL of a store
- Adds UploadFS.Store.prototype.getFileRelativeURL(path) to get the relative URL of a file in a store
- Adds UploadFS.addPathAttributeToFiles(where) to add the path attribute to existing files
- Unblock the UploadFS.importFromURL()
- Fixes file deletion during upload (stop uploading and removes temp file)

You can upgrade existing documents to add the `path` attribute by calling the `UploadFS.addPathAttributeToFiles(where)`
which will upgrade all collections linked to any UploadFS store, the `where` option is not required, default predicate is `{path: null}`.


### Version 0.6.7

- Allows to define stores on server only, use the store name directly as a reference on the client
- Fixes an error caused by the use of an upsert in multi-server environment (mongo)

### Version 0.6.5

- Fixes 504 Gateway timeout error when file is not served by UploadFS

### Version 0.6.4

- Allows to set temp directory permissions

### Version 0.6.3

- Fixes iOS and Android issues
- Adds CORS support

### Version 0.6.1

- Brings a huge improvement to large file transfer
- Uses POST HTTP method instead of Meteor methods to upload files
- Simplifies code for future versions

#### Breaking changes

##### UploadFS.readAsArrayBuffer() is DEPRECATED

The method `UploadFS.readAsArrayBuffer()` is not available anymore, as uploads are using POST binary data, we don't need `ArrayBuffer`.

```js
import {UploadFS} from 'meteor/jalik:ufs';

UploadFS.selectFiles(function(ev){
    UploadFS.readAsArrayBuffer(ev, function (data, file) {
        let photo = {
            name: file.name,
            size: file.size,
            type: file.type
        };
        let worker = new UploadFS.Uploader({
            store: PhotoStore,
            data: data,
            file: photo
        });
        worker.start();
    });
});
```

The new code is smaller and easier to read :

```js
import {UploadFS} from 'meteor/jalik:ufs';

UploadFS.selectFiles(function(file){
    let photo = {
        name: file.name,
        size: file.size,
        type: file.type
    };
    let worker = new UploadFS.Uploader({
        store: PhotoStore,
        data: file,
        file: photo
    });
    worker.start();
});
```

##### Permissions are defined differently

Before `v0.6.1` you would do like this :

```js
Photos.allow({
    insert(userId, doc) {
        return userId;
    },
    update(userId, doc) {
        return userId === doc.userId;
    },
    remove(userId, doc) {
        return userId === doc.userId;
    }
});
```

Now you can set the permissions when you create the store :

```js
import {LocalStore} from 'meteor/jalik:ufs-local';

const Photos = new Mongo.Collection("photos");

PhotoStore = new LocalStore({
    collection: Photos,
    name: 'photos',
    path: '/uploads/photos',
    permissions: new UploadFS.StorePermissions({
        insert(userId, doc) {
            return userId;
        },
        update(userId, doc) {
            return userId === doc.userId;
        },
        remove(userId, doc) {
            return userId === doc.userId;
        }
    })
});
```

## License

UploadFS is released under the [MIT License](http://www.opensource.org/licenses/MIT).
