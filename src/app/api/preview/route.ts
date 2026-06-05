import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const home = searchParams.get('home')
  const away = searchParams.get('away')
  const stage = searchParams.get('stage') ?? 'group'

  if (!home || !away) {
    return NextResponse.json({ error: 'Missing team names' }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `Give a 2-sentence match preview for ${home} vs ${away} at the 2026 FIFA World Cup (${stage} stage). Focus on current form, key players, and tactical matchup. Be specific and analytical. No fluff. Plain text only, no markdown.`,
        },
      ],
    })

    const text =
      message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ preview: text })
  } catch (err) {
    console.error('Preview error:', err)
    return NextResponse.json({ error: 'Preview unavailable' }, { status: 500 })
  }
}
