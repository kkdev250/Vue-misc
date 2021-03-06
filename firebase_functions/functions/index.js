const functions = require('firebase-functions');
const os = require('os');
const path = require('path');
const spawn = require('child-process-promise').spawn;
const cors = require('cors')({origin: true});
const Busboy = require('busboy');
const fs = require('fs');

const gcconfig = {
    projectId: "fb-functions-37352",
    keyFilename: "fb-functions-37352-firebase-adminsdk-fxmxb-b3b37a92d6.json"
}

const gcs = require('@google-cloud/storage')(gcconfig);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.onFileDelete = functions.storage.object().onDelete(event => {
    console.log(event);
    return;
  });

exports.onFileChange = functions.storage.object().onFinalize(event => {
    //console.log(event);
    const bucket = event.bucket;
    const contentType = event.contentType;
    const filePath = event.name;
    console.log('File change detected, function execution started');


    if (path.basename(filePath).startsWith('resized-')) {
        console.log('We already resized that file!');
        return;
    }

    const destBucket = gcs.bucket(bucket);
    const tmpFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const metadata = { contentType: contentType };
    return destBucket.file(filePath).download({
        destination: tmpFilePath
    }).then(() => {
        return spawn('convert', [tmpFilePath, '-resize', '500x500', tmpFilePath]);
    }).then(() => {
        return destBucket.upload(tmpFilePath, {
            destination: 'resized-' + path.basename(filePath),
            metadata: metadata
        })
    })
   });

   exports.uploadFile = functions.https.onRequest((req, res) => {
        cors(req, res, () => {
            if (req.method !== 'POST') {
                return res.status(500).json({
                    message: 'Not allowed'
                });
            }
            const busboy = new Busboy({headers: req.headers});
            let uploadData = null;

            busboy
                .on('file', (fieldname, file, filename, encoding, mimetype) => {
                    const filepath = path.join(os.tmpdir(), filename);
                    uploadData = { file: filepath, type: mimetype };
                    file.pipe(fs.createWriteStream(filepath));
                });

            busboy
                .on('finish', () => {
                    const bucket = gcs.bucket('fb-functions-37352.appspot.com');
                    bucket.upload(uploadData.file, {
                        uploadType: 'media',
                        metadata: {
                            metadata: {
                                contentType: uploadData.type
                            }
                        }
                    })
                .then(() => {
                    res.status(200).json({
                        message: 'It worked!'
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    });
                });
            });

            busboy.end(req.rawBody);
        });
   });