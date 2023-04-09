// https://platform.openai.com/docs/api-reference/chat

export class Bot {
  constructor(openai_key, system) {
    this.openai_key = openai_key;
    this.messages = [
      {role: 'system', content: system}
    ];
  }

  get system() {
    return this.messages[0].content;
  }
  set system(content) {
    this.messages[0].content = content;
  }

  async interact(message, ...cbs) {
    const t0 = Date.now();
    this.messages.push({role: 'user', content: message});
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions', {
        method: 'post',
        headers: new Headers({
          // https://platform.openai.com/account/usage
          'Authorization': `Bearer ${this.openai_key}`,
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: this.messages,
          stream: true,
        }),
      });
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let content = '';
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      for (const line of value.split(/\n\n/g)) {
        if (!line.startsWith('data: ')) continue;
        const data = line.replace(/^data: /, '');
        if (data !== '[DONE]') {
          const d = JSON.parse(data);
          const delta = d.choices[0].delta.content;
          if (delta) {
            // console.info('chatgpt partial:', Date.now() - t0, delta);
            cbs.forEach(cb => cb(delta));
            content += delta;
          }
        }
      }
    }
    cbs.forEach(cb => cb(''));
    // console.log('chatgpt final:', content);
    this.messages.push({role: 'user', content});
    return content;
  }
}
