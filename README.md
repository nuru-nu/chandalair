# Mr Chan Da Lair

https://docs.google.com/document/d/1BdPuNHVoCk5rLPjSp9jjVE9cyADgOgKuxb2mgQ4xBFM/edit#

Simple ChatGPT Web-Interface using Azure cognitive speech services for speech
to text and text to speech.


## Configure the App

This app requires an Azure key to interact with the Azure speech API, and an
OpenAI key to interact with ChatGPT. There are two ways to provision these:

1. Either activate the Firebase database by specifying a valid Firebase config
   in the `FIREBASE` symbol in `public/config.js`. That database is expected
   to have a `config/tokens` document with the fields `azure_key`,
   `azure_region`, and `openai_key`. Further, it is expected to have a
   collection named `events` that is used for logging, and a single user with
   the email `EMAIL` (in `public/config.js`) that is allowed to read and write
   data to the Firestore. A user can retrieve these keys from the backend by
   specifying the password matching that login.

   For convenience, the password is stored in the session storage.

2. Or by manually specifying the keys (and Azure region) through the text
   inputs. This way the app can also be used without any Firebase instance at
   all.

   For convenience, these API keys are stored in the local storage.


## Start the app

Copy `public/config.js.example` to `public/config.js` and adapt as described
above.

Local development: start `(cd public && python3 -m http.server)`

Push to production: `./push.sh` (adapt from `push.sh.example`)

Push to devel: `./push.sh test` (adapt from `push.sh.example`)


## TODOs

- Improve design.
- Fancy swiss.gl-based animation of the generated voice.
- More robust behaviour.
- Modulate voice (shushing, excitement, ...).
- Add favicon.
- Make speaker change more robust.
- Browse db.

Ideas for more robust behaviour:

- Re-enable recording a bit earlier.
- Filter very short questions.
