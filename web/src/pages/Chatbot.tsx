import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Message { role: 'user' | 'model'; text: string }

const SUGGESTED = [
  'Is karahi good for muscle gain?',
  'How much protein is in biryani?',
  'What are lighter desi breakfast options?',
  'Is nihari heavy for dinner?',
]

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const geminiKey = import.meta.env.VITE_GEMINI_KEY

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const updated: Message[] = [...messages, { role: 'user', text }]
    setMessages(updated); setInput(''); setLoading(true)
    const goal = profile?.goal ?? 'curious'
    const sys = `You are a friendly South Asian food and nutrition assistant. User's goal: ${goal.replace('_', ' ')}. Restrictions: ${profile?.restrictions?.join(', ') || 'none'}. Answer in 2-4 sentences. Focus on Pakistani/desi food. Never be judgmental.`
    try {
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
      const { data } = await axios.post(GEMINI_URL, {
        contents: [{ role: 'user', parts: [{ text: sys }] }, ...updated.map(m => ({ role: m.role, parts: [{ text: m.text }] }))],
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
      })
      setMessages(p => [...p, { role: 'model', text: data.candidates[0].content.parts[0].text }])
    } catch {
      setMessages(p => [...p, { role: 'model', text: 'Sorry, I could not reach the AI right now.' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-[72vh]">
      <h1 className="text-2xl font-bold mb-4">Ask about your diet</h1>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {!messages.length && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 mb-3">Try asking:</p>
            {SUGGESTED.map(q => (
              <button key={q} onClick={() => send(q)}
                className="block w-full text-left text-sm border rounded-lg px-3 py-2 hover:bg-brand-50 transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-brand-700 text-white' : 'bg-gray-100'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm text-gray-400">Thinking…</div></div>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your food…"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <button type="submit" disabled={loading || !input.trim()}
          className="bg-brand-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-brand-800">Send</button>
      </form>
    </div>
  )
}
