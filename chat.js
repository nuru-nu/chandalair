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

  async interact(message) {
    this.messages.push({role: 'user', content: message});
    const reply = await (await fetch(
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
        }),
      })).json();
    console.log('chatgpt', reply);
    const content = reply.choices[0].message.content;  
    this.messages.push({role: 'user', content});
    return content;
  }
}
