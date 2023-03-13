import { fetchSSE } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'

export class ProxyProvider implements Provider {
  constructor(private proxyHost: string) {
    this.proxyHost = proxyHost
  }

  private buildPrompt(prompt: string): string {
    return prompt
  }

  async generateAnswer(params: GenerateAnswerParams) {
    let result = ''
    await fetchSSE(this.proxyHost, {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        //Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        prompt: this.buildPrompt(params.prompt),
        stream: true,
        max_tokens: 2048,
      }),
      onMessage(message) {
        console.debug('sse message', message)
        if (message === '[DONE]') {
          params.onEvent({ type: 'done' })
          return
        }
        let data
        try {
          data = JSON.parse(message)
          const text = data.choices[0].text
          if (text === '<|im_end|>' || text === '<|im_sep|>') {
            return
          }
          result += text
          params.onEvent({
            type: 'answer',
            data: {
              text: result,
              messageId: data.id,
              conversationId: data.id,
            },
          })
        } catch (err) {
          console.error(err)
          return
        }
      },
    })
    return {}
  }
}
