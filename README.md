# Mr Chan Da Lair

https://docs.google.com/document/d/1BdPuNHVoCk5rLPjSp9jjVE9cyADgOgKuxb2mgQ4xBFM/edit#

Simple ChatGPT Web-Interface using Azure cognitive speech services for speech
to text and text to speech.

Configuration (required before use): Copy `config.json.example` to
`config.json` and add API keys. Note that API key is shown in client and there
is no rate limiting currently, so share any published version with care (and
make sure to set tight spending limits).

Local development: start `python3 server.py`

Push to production: `./push.sh` (adapt from `push.sh.example`)

Push to devel: `./push.sh test` (adapt from `push.sh.example`)

TODO:

- Fancy swiss.gl-based animation of the generated voice.
- Connection to DMX controller.
- Improve design, dark mode.
- Securisation, especially not showing the actual OpenAI code.
- Measure delays, try re-routing through simple server.
- Log all interaction.
- Stream chat response.
- More robust behaviour.
- Modulate voice (shushing, excitement, ...).
- Add favicon.
- Make speaker change more robust.

Ideas for more robust behaviour:

- Re-enable recording a bit earlier.
- Filter very short questions.