import { useEffect, useState } from 'react'
import './App.css'

const QUESTIONS = [
  {
    id: 1,
    text: 'Tu compañero de equipo te dice que vive con VIH. ¿Qué haces primero?',
    options: ['Me incomodo', 'Le pregunto si está bien', 'Me alejo un poco', 'No cambia nada'],
    reveal: ['Preguntar con respeto y ofrecer apoyo es lo más útil.', 'La incomodidad no ayuda a la persona.'],
    correct: ['Le pregunto si está bien', 'No cambia nada']
  },
  {
    id: 2,
    text: '¿Compartirías una bebida con alguien que tiene VIH?',
    options: ['Sí', 'No', 'Tal vez', 'No estoy seguro/a'],
    reveal: ['El VIH no se transmite por fluidos salivales en contextos sociales como compartir bebida.'],
    correct: ['Sí']
  },
  {
    id: 3,
    text: 'Estás en una fiesta y alguien menciona que una persona tiene VIH. ¿Qué piensas automáticamente?',
    options: ['“Qué fuerte”', '“No pasa nada”', '“Deberían tener cuidado”', '“No sé suficiente del tema”'],
    reveal: ['Evitar juzgar y buscar información confiable ayuda a disminuir el estigma.'],
    correct: ['“No pasa nada”', '“No sé suficiente del tema”']
  },
  {
    id: 4,
    text: '¿Te sentirías cómodo/a saliendo con alguien que vive con VIH y es indetectable?',
    options: ['Sí', 'No', 'Tal vez', 'No entiendo qué significa “indetectable”'],
    reveal: ['Indetectable = no detectable = no transmisible por vía sexual (U=U).'],
    correct: ['Sí', 'Tal vez']
  },
  {
    id: 5,
    text: 'Tu roomie tiene VIH. ¿Cambiarías algo en el depa?',
    options: ['Compartiría todo normal', 'Tendría más cuidado', 'Evitaría ciertas cosas', 'Me mudaría'],
    reveal: ['La convivencia no requiere cambios especiales; el estigma sí puede afectar la relación.'],
    correct: ['Compartiría todo normal']
  },
  {
    id: 6,
    text: '¿Crees que todavía existe discriminación hacia personas con VIH?',
    options: ['Muchísima', 'Un poco', 'Casi no', 'No sé'],
    reveal: ['La discriminación persiste y tiene efectos en el acceso a servicios y la salud mental.'],
    correct: ['Muchísima', 'Un poco']
  },
  {
    id: 7,
    text: '¿Te sentarías junto a una persona con VIH en clase?',
    options: ['Sí', 'No', 'Me daría nervio', 'Depende'],
    reveal: ['Sentarse juntos no implica riesgo; los nervios son entendibles pero se pueden superar con información.'],
    correct: ['Sí', 'Depende']
  },
  {
    id: 8,
    text: '¿Qué harías si escuchas un comentario discriminatorio sobre VIH en un grupo de amigos?',
    options: ['Cambiar el tema', 'Reírme incómodo/a', 'Defender a la persona', 'No decir nada'],
    reveal: ['Intervenir o expresar desacuerdo ayuda a reducir la normalización del estigma.'],
    correct: ['Defender a la persona', 'Cambiar el tema']
  },
  {
    id: 9,
    text: '¿Qué palabra asocias primero con VIH?',
    options: ['Enfermedad', 'Miedo', 'Desinformación', 'Persona'],
    reveal: ['Asociar con persona y no solo con enfermedad ayuda a humanizar.'],
    correct: ['Persona', 'Desinformación']
  },
  {
    id: 10,
    text: '¿Crees que sabes cómo se transmite realmente el VIH?',
    options: ['Sí, completamente', 'Más o menos', 'Muy poco', 'No realmente'],
    reveal: ['Compartir información correcta reduce el estigma y protege la salud pública.'],
    correct: ['Sí, completamente', 'Más o menos']
  }
]

function App() {
  const [phase, setPhase] = useState('intro') // intro, quiz, reveal, result, finalNote
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
        // after showing results briefly, show the final citation screen
        setTimeout(() => setPhase('finalNote'), 3000)
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
              {QUESTIONS[index].options.map((o) => {
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

        {phase === 'finalNote' && (
          <div className="card final-screen fade enter" style={{background:'#000',color:'#fff'}}>
            <div style={{fontWeight:700,fontSize:18,textAlign:'center',marginBottom:12}}>En México cada 3 de cada 10 personas con VIH evitan usar servicios de salud por miedo a la discriminación.</div>
            <div style={{textAlign:'center',fontSize:13,opacity:0.85}}>Gobierno de México, 2020</div>
            <div style={{height:18}} />
            <div style={{display:'flex',gap:8,justifyContent:'center'}}>
              <button className="start-btn" onClick={restart}>Volver a empezar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
