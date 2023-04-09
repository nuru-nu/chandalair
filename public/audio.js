
const sdk = window.SpeechSDK;


export let speechConfig = null;

export async function init(auth) {
  const token = await (await fetch(
    `https://${auth.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': auth.key,
      }),
  })).text();
  auth = {...auth, token};
  speechConfig = sdk.SpeechConfig.fromAuthorizationToken(auth.token, auth.region);
  speechConfig.outputFormat = sdk.OutputFormat.Detailed;
  speechConfig.speechRecognitionLanguage = 'en-US';
  speechConfig.speechSynthesisVoiceName = 'Microsoft Server Speech Text to Speech Voice (en-US, JennyNeural)';
  speechConfig.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;
  // speechConfig.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm;

  const listener = new Listener(speechConfig);
  const speaker = new Speaker(speechConfig);
  await speaker.init(auth);
  
  return { listener, speaker };
}


class Listener {

  constructor(speechConfig) {
    this.speechConfig = speechConfig;
    this.listeners = new Set();
    this.reco = null;
  }

  register(listener) {
    this.listeners.add(listener);
  }

  notify(result, finished) {
    // https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechrecognitioneventargs?view=azure-node-latest
    const data = JSON.parse(result.json);
    // console.log('data', data);
    for (const listener of this.listeners) {
      const text = finished ? data.DisplayText : data.Text;
      listener(text, finished, data.RecognitionStatus);
    }
  }

  onRecognizing(sender, recognitionEventArgs) {
    // console.log('onRecognizing', recognitionEventArgs);
    this.notify(recognitionEventArgs.result, false);
  }

  onRecognized(sender, recognitionEventArgs) {
    // console.log('onRecognized', recognitionEventArgs);
    this.notify(recognitionEventArgs.result, true);
  }

  start() {
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    this.reco = new sdk.SpeechRecognizer(
        this.speechConfig, audioConfig);
    this.reco.recognizing = this.onRecognizing.bind(this);
    this.reco.recognized = this.onRecognized.bind(this);
    this.reco.startContinuousRecognitionAsync();
  }

  pause() {
    this.reco && this.reco.stopContinuousRecognitionAsync();
  }

  resume() {
    this.reco && this.reco.startContinuousRecognitionAsync();
  }

  stop() {
    this.reco.stopContinuousRecognitionAsync(
      () => {
          this.reco.close();
          this.reco = null;
      },
      err => {
          this.reco.close();
          this.reco = null;
      }
    );
  }

  get listening() {
    return this.reco !== null;
  }
}


class Speaker {

  constructor(speechConfig) {
    this.speakers = [];
    this.synthesizer = null;
    this.speaking = false;
    this.speechConfig = speechConfig;
    this.listeners = new Set();
  }

  async init(auth) {
    this.speakers = await (await fetch(
        `https://${auth.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
          headers: new Headers({
            Authorization: `Bearer ${auth.token}`,
          })
        }
    )).json();
  }

  register(listener) {
    this.listeners.add(listener);
  }

  notify(id, secs) {
    for (const listener of this.listeners) {
      listener(id, secs);
    }
  }

  sayit(text) {
    return new Promise((resolve, reject) => {
      if (!text) return resolve();
      this.speaking = true;
      const player = new sdk.SpeakerAudioDestination();
      const t0 = Date.now();
      player.onAudioStart = function(_) {
        // console.log("playback started");
      }
      player.onAudioEnd = function (_) {
        // console.log("playback finished");
        resolve();
      };
      const audioConfig  = sdk.AudioConfig.fromSpeakerOutput(player);
      const synthesizer = new sdk.SpeechSynthesizer(
          this.speechConfig, audioConfig);
    
      // synthesizer.synthesizing = function (s, e) {
      //   console.log('synthesizing', e, e.result.audioData);
      // };
      // synthesizer.wordBoundary = function (s, e) {
      //   console.log('wordBoundary', e);
      // };

      synthesizer.visemeReceived = (_, e) => {
        // https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/how-to-speech-synthesis-viseme?tabs=visemeid&pivots=programming-language-csharp#viseme-id
        // offset ticks [100ns]
        // *not* called in real-time, but ~10x faster
        // const t = (Date.now() - t0);
        const secs = e.audioOffset / 1e7;
        const viseme = e.visemeId;
        // console.log('visemeReceived', t, secs, viseme);
        this.notify(viseme, secs);
      }

      // synthesizer.bookmarkReached = function (s, e) {
      //   console.log('bookmarkReached', e);
      // }
    
      synthesizer.speakTextAsync(text,
        result => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // Note: this means the data is buffered, but not yet spoken.
            // console.log('synthesizer finished', result);
          } else {
            console.log('synthesizer failed', result.errorDetails);
            reject(`Could not synthesize: ${result.errorDetails}`);
          }
          synthesizer.close();
          this.speaking = false;
        },
        err => {
          console.log('synthesizer error', err);
          synthesizer.close();
          this.speaking = false;
        }
      );
    });
  }
}

// This function returns a `done` promise and a callback that can be used for
// enqueueing text asynchronuously. As soon as enough text is queued (currently
// determined simply by looking for punctuation), the async `sayit` is called
// with that text, while more text is being queued in parallel.
// Once the callback is called with an empty text, the enqueued text is finished
// and then `done` resolves.
export function buffered(sayit) {
  let buffered_resolve, buffered_reject;
  let ongoing = Promise.resolve(), partial = '';
  const t0 = Date.now();
  const done = new Promise((resolve, reject) => {
    buffered_resolve = resolve;
    buffered_reject = reject;
  });
  function cb(text) {
    try {
      partial += text;
      if (!text || partial.match(/[\.,?!:;]\s*$/)) {
        ongoing = ongoing.then(() => {
          const text = partial;
          partial = '';
          return sayit(text);
        });
        text || ongoing.then(buffered_resolve).catch(buffered_reject);
      }
    } catch (e) {
      buffered_reject(e);
    }
  }
  return {done, cb};
}
