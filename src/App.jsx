import { useEffect, useState } from 'react'
import './App.css'

const QUESTIONS = [
  {
    id: 1,
    text: 'Tu amigo te dice que vive con VIH.',
    reveal: [
      'El VIH no se transmite por convivencia.',
      'El rechazo social sí afecta la salud mental.'
    ],
    // 'Buscaría informarme' is considered the information-forward answer
    correct: ['Buscaría informarme', 'No cambiaría nada']
  },
  {
    id: 2,
    text: 'Alguien con VIH te ofrece comida en una reunión.',
    reveal: [
      'No hay riesgo de transmisión por compartir comida.',
      'Evitar algo por miedo refuerza el estigma.'
    ],
    correct: ['No cambiaría nada', 'Buscaría informarme']
  },
  {
    id: 3,
    text: 'Escuchas un rumor sobre la vida privada de alguien con VIH.',
    reveal: [
      'Los rumores dañan reputaciones y aumentan la discriminación.',
      'Preguntar con respeto y no difundir es lo responsable.'
    ],
    correct: ['Buscaría informarme', 'No cambiaría nada']
  },
  {
    id: 4,
    text: 'Ves que alguien con VIH tiene una relación de pareja estable.',
    reveal: [
      'Las personas con VIH pueden llevar relaciones sanas y seguras.',
      'Desconfiar por estigma genera exclusión.'
    ],
    correct: ['No cambiaría nada', 'Buscaría informarme']
  },
  {
    id: 5,
    text: 'Te ofrecen voluntariado con personas que viven con VIH.',
    reveal: [
      'Participar reduce prejuicios y fomenta empatía.',
      'Evitar oportunidades refuerza el aislamiento.'
    ],
    correct: ['Buscaría informarme', 'No cambiaría nada']
  }
]

const OPTIONS = [
  'Me alejaría',
  'No cambiaría nada',
  'Tendría dudas',
  'Buscaría informarme'
]

function App() {
  const [phase, setPhase] = useState('intro') // intro, quiz, reveal, result
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [revealLines, setRevealLines] = useState([])
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (phase === 'result') {
      // compute score
      const correctCount = answers.filter((a) => a.information).length
      setScore(Math.round((correctCount / QUESTIONS.length) * 100))
    }
  }, [phase])

  function start() {
    setPhase('quiz')
    setIndex(0)
    setAnswers([])
    setScore(0)
  }

  function choose(option) {
    const q = QUESTIONS[index]
    const information = q.correct.includes(option)
    const stigma = !information
    const item = { qid: q.id, option, information, stigma }
    setAnswers((s) => [...s, item])
    setRevealLines(q.reveal)
    setPhase('reveal')
    // after a short delay, proceed
    setTimeout(() => {
      if (index + 1 < QUESTIONS.length) {
        setIndex((i) => i + 1)
        setPhase('quiz')
      } else {
        setPhase('result')
      }
    }, 1600)
  }

  function restart() {
    setPhase('intro')
    setIndex(0)
    setAnswers([])
    setScore(0)
  }

  // campus stats come from an external source if available.
  // By default we fall back to a sample local file (`/stats.json`).
  const [campusStats, setCampusStats] = useState([
    { label: 'Dudó en compartir comida', pct: 42 },
    { label: 'Cree mitos', pct: 68 },
    { label: 'Buscaría informarse', pct: 31 }
  ])

  useEffect(() => {
    // Try to load config.json (optional) which may contain { "dataUrl": "..." }
    async function loadStats() {
      try {
        const cfgResp = await fetch('/config.json')
        let dataUrl = '/stats.json'
        if (cfgResp.ok) {
          const cfg = await cfgResp.json()
          if (cfg && cfg.dataUrl) dataUrl = cfg.dataUrl
        }

        const resp = await fetch(dataUrl)
        if (!resp.ok) throw new Error('stats fetch failed')

        const text = await resp.text()

        // Google Sheets JSON output (gviz) is wrapped, detect and parse
        if (dataUrl.includes('docs.google.com') && text.startsWith('/*')) {
          // google returns something like: /*O_o*/\ngoogle.visualization.Query.setResponse(...)
          const jsonText = text.replace(/^.*setResponse\(|\);?\s*$/g, '')
          const g = JSON.parse(jsonText)
          const rows = g.table.rows || []
          const parsed = rows.map((r) => ({ label: r.c[0]?.v || '', pct: Number(r.c[1]?.v) || 0 }))
          setCampusStats(parsed)
          return
        }

        // Airtable's API returns {records:[{fields:{label,pct}}]}
        try {
          const json = JSON.parse(text)
          if (Array.isArray(json)) {
            setCampusStats(json)
            return
          }
          if (json.records) {
            const parsed = json.records.map((r) => ({ label: r.fields.label || r.fields.Label || '', pct: r.fields.pct || r.fields.Pct || 0 }))
            setCampusStats(parsed)
            return
          }
        } catch (e) {
          // not JSON — fall through
        }

        // fallback: try parsing as CSV (simple)
        if (text.includes(',')) {
          const lines = text.trim().split('\n')
          const parsed = lines.map((ln) => {
            const [label, pct] = ln.split(',').map((s) => s.trim())
            return { label, pct: Number(pct) }
          })
          setCampusStats(parsed)
          return
        }
      } catch (err) {
        // keep fallback hardcoded stats
        console.warn('Could not load remote stats, using defaults', err)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="app">
      <div className="center">
        <div className="brand">¿Lo evitarías?</div>
        <div className="subtitle">Responde rápido. Sin pensarlo demasiado.</div>

        {phase === 'intro' && (
          <div className="card fade enter">
            <p className="small-muted">Una app rápida sobre reacciones y estigma</p>
            <div style={{height:18}} />
            <button className="start-btn" onClick={start}>Empezar</button>
            <div className="muted-center">Menos de 3 minutos — tarjetas rápidas</div>
          </div>
        )}

        {phase === 'quiz' && (
          <div className="card fade enter">
            <div className="question">{QUESTIONS[index].text}</div>
            <div className="options">
              {OPTIONS.map((o) => {
                return (
                  <button
                    key={o}
                    className={`opt`}
                    onClick={() => choose(o)}
                  >
                    {o}
                  </button>
                )
              })}
            </div>
            <div className="progress">
              <div className="small-muted">{index + 1}/{QUESTIONS.length}</div>
              <div className="small-muted">Responde rápido</div>
            </div>
          </div>
        )}

        {phase === 'reveal' && (
          <div className="card fade enter">
            <div className="question">{QUESTIONS[index].text}</div>
            <div className="reveal">
              {revealLines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
            <div className="muted-center">Siguiente en breve…</div>
          </div>
        )}

        {phase === 'result' && (
          <div className="card result fade enter">
            <div className="small-muted">Tus respuestas muestran…</div>
            <div className="score-big">{score}% información correcta</div>
            <div className="breakdown">
              <div className="pill">{100 - score}% influenciadas por estigma</div>
            </div>
            <div className="scorebar">
              <div className="scorefill" style={{width: `${score}%`}} />
            </div>

            <div className="stats">
              <div className="small-muted">¿Quieres ver cómo respondería el campus?</div>
              {campusStats.map((s) => (
                <div key={s.label} className="stat-row">
                  <div className="small-muted">{s.label}</div>
                  <div>{s.pct}%</div>
                </div>
              ))}
            </div>

            <button className="continue" onClick={restart}>Volver a intentar</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
