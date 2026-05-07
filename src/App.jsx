import { useEffect, useState } from 'react'
import './App.css'

const QUESTIONS = [
  {
    id: 1,
    text: 'Tu compañero de equipo te dice que vive con VIH, qué haces?',
    options: ['Me incomodo', 'Le pregunto si está bien', 'Me alejo un poco', 'No cambia nada'],
    reveal: ['Preguntar con respeto y ofrecer apoyo es lo más útil.', 'La incomodidad no ayuda a la persona.'],
    correct: ['Le pregunto si está bien', 'No cambia nada']
  },
  {
    id: 2,
    text: 'Compartirías una bebida con alguien que tiene VIH?',
    options: ['Sí', 'No', 'Tal vez', 'No estoy seguro/a'],
    reveal: ['El VIH no se transmite por fluidos salivales en contextos sociales como compartir bebida.'],
    correct: ['Sí']
  },
  {
    id: 3,
    text: 'Estás en una fiesta y alguien menciona que una persona tiene VIH, qué piensas automáticamente?',
    options: ['Lol q mal', '🤣', 'A Canelita le huele la cola', 'A la roomie de Cris le suda la cola'],
    reveal: ['Evitar juzgar y buscar información confiable ayuda a disminuir el estigma.'],
    correct: ['No pasa nada', 'No sé suficiente del tema']
  },
  {
    id: 4,
    text: 'Te sentirías cómodo/a saliendo con alguien que vive con VIH indetectable',
    options: ['Sí', 'No', 'Tal vez', 'No sé qué significa VIH indetectable'],
    reveal: ['Indetectable significa que no tiene la suficiente carga viral como para dar positivo en la prueba pero puede seguir transmiiendo el virus.'],
    correct: ['Sí', 'Tal vez']
  },
  {
    id: 5,
    text: 'Tu roomie tiene VIH, cambiarías algo en tu vivienda?',
    options: ['Compartiría todo normal', 'Tendría más cuidado', 'Evitaría ciertas cosas', 'Me mudaría'],
    reveal: ['La convivencia con personas con VIH no requiere cambios especiales, pero el estigma sí puede afectar la relación.'],
    correct: ['Compartiría todo normal']
  },
  {
    id: 6,
    text: 'Crees que todavía existe discriminación hacia personas con VIH?',
    options: ['Mucha', 'Poca', 'Casi no', 'No sé'],
    reveal: ['La discriminación persiste y sigue teniendo efectos en cómo viven su vida.'],
    correct: ['Mucha']
  },
  {
    id: 7,
    text: '¿Te sentarías junto a una persona con VIH en clase?',
    options: ['Sí', 'No', 'Me daría nervio', 'Depende'],
    reveal: ['Sentarte con alguien con VIH no implica riesgo, si tratas de incluírlos no vas a correr ningún riesgo.'],
    correct: ['Sí']
  },
  {
    id: 8,
    text: 'Qué harías si escuchas un comentario discriminatorio sobre VIH en un grupo de amigos?',
    options: ['Cambiar el tema', 'Reírme incómodo/a', 'Defender a la persona', 'No decir nada'],
    reveal: ['No debemos normalizar el estigma hacia las personas con VIH.'],
    correct: ['Defender a la persona']
  },
  {
    id: 9,
    text: 'Qué palabra asocias primero con VIH?',
    options: ['Enfermedad', 'Miedo', 'Desinformación', 'Persona'],
    reveal: ['Asociar con persona y no solo con enfermedad ayuda a humanizar a quienes padecen VIH.'],
    correct: ['Persona', 'Desinformación']
  },
  {
    id: 10,
    text: 'Crees que sabes cómo se transmite realmente el VIH?',
    options: ['Sí', 'Más o menos', 'Muy poco', 'No realmente'],
    reveal: ['Por medio de contacto sexual sin protección y de madre a hijo, así como transfusiones o jeringas con sangre infectada'],
    correct: ['Sí']
  }
]

function App() {
  const [phase, setPhase] = useState('intro') 
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
    
    setTimeout(() => {
      if (index + 1 < QUESTIONS.length) {
        setIndex((i) => i + 1)
        setPhase('quiz')
      } else {
        setPhase('result')
        
        setTimeout(() => setPhase('finalNote'), 3000)
      }
    }, 5200)
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
        <div className="brand">Lo evitarías?</div>

        {phase === 'intro' && (
          <div className="card fade enter">
            <p className="small-muted">Aprende sobre el VIH/SIDA</p>
            <div style={{height:18}} />
            <button className="start-btn" onClick={start}>Empezar</button>
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
              <div style={{height:10}} />
              {/* show the options with highlights: correct in light green; if user chose an incorrect option, mark it dark red */}
              <div className="options">
                {QUESTIONS[index].options.map((o) => {
                  const last = answers[answers.length - 1]
                  const isCorrect = QUESTIONS[index].correct.includes(o)
                  const isSelected = last && last.option === o
                  const cls = `opt ${isCorrect ? 'correct highlight' : ''} ${isSelected && !isCorrect ? 'incorrect-selected' : ''}`
                  return (
                    <button key={o} className={cls} disabled>
                      {o}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="muted-center">Siguiente pregunta…</div>
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
              <div className="small-muted">Respuestas de otros compañeros</div>
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
