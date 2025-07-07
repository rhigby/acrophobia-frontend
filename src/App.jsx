import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

const socket = io('https://your-backend-name.onrender.com', {
  transports: ['websocket'],
  secure: true
})

export default function AcrophobiaGame() {
  const [room, setRoom] = useState('')
  const [username, setUsername] = useState('')
  const [joined, setJoined] = useState(false)
  const [acronym, setAcronym] = useState('')
  const [entries, setEntries] = useState([])
  const [submission, setSubmission] = useState('')
  const [phase, setPhase] = useState('waiting')
  const [votes, setVotes] = useState({})
  const [scores, setScores] = useState({})
  const [displayedLetters, setDisplayedLetters] = useState([])
  const [roundNumber, setRoundNumber] = useState(1)
  const [timer, setTimer] = useState(0)
  const intervalRef = useRef(null)
  const countdownRef = useRef(null)
  const letterIndexRef = useRef(0)
  const latestAcronymRef = useRef('')

  useEffect(() => {
    socket.on('acronym', (newAcronym) => {
      clearInterval(intervalRef.current)
      setAcronym(newAcronym)
      setDisplayedLetters([])
      letterIndexRef.current = 0
      latestAcronymRef.current = newAcronym
      playSound()
      revealLettersSequentially()
    })
    socket.on('phase', (newPhase) => {
      setPhase(newPhase)
      if (newPhase === 'submit') startCountdown(60)
      else if (newPhase === 'vote') startCountdown(30)
    })
    socket.on('entries', setEntries)
    socket.on('votes', setVotes)
    socket.on('scores', setScores)
    socket.on('round_number', setRoundNumber)
  }, [])

  const revealLettersSequentially = () => {
    intervalRef.current = setInterval(() => {
      setDisplayedLetters((prev) => {
        const index = letterIndexRef.current
        const acro = latestAcronymRef.current
        if (index < acro.length) {
          letterIndexRef.current++
          return [...prev, acro[index]]
        } else {
          clearInterval(intervalRef.current)
          return prev
        }
      })
    }, 500)
  }

  const playSound = () => {
    const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg")
    audio.play().catch(() => {})
  }

  const startCountdown = (seconds) => {
    setTimer(seconds)
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const joinRoom = () => {
    if (!room || !username) return
    socket.emit('join_room', { room, username })
    setJoined(true)
  }

  const submitEntry = () => {
    if (!submission || phase !== 'submit') return
    socket.emit('submit_entry', { room, username, text: submission })
    setSubmission('')
  }

  const voteEntry = (entryId) => {
    if (phase !== 'vote') return
    socket.emit('vote_entry', { room, username, entryId })
  }

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-blue-200 p-6">
        <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md space-y-4">
          <h1 className="text-3xl font-extrabold text-center text-blue-800">Join Acrophobia</h1>
          <input
            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Room Code"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <input
            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 w-full rounded-md transition"
            onClick={joinRoom}
          >
            Join Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Room: <span className="font-mono">{room}</span></h2>
          <h3 className="text-md text-gray-600">Round {roundNumber} of 5</h3>
          <div className="text-red-500 text-lg font-bold">Time Left: {timer}s</div>
          <div className="flex justify-center gap-2 mt-4">
            {displayedLetters.map((letter, idx) => (
              <div key={idx} className="w-12 h-12 bg-blue-600 text-white text-2xl font-bold rounded-md shadow flex items-center justify-center animate-flip">
                {letter}
              </div>
            ))}
          </div>
        </div>

        {phase === 'submit' && (
          <div className="space-y-2">
            <textarea
              className="w-full h-24 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Your funny/clever acronym explanation..."
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition"
              onClick={submitEntry}
            >
              Submit
            </button>
          </div>
        )}

        {phase === 'vote' && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Vote for your favorite:</h4>
            {entries.map((e, idx) => (
              <button
                key={idx}
                className="block w-full text-left border border-gray-300 bg-white rounded-lg shadow-md p-3 hover:bg-gray-50 transition"
                onClick={() => voteEntry(e.id)}
              >
                {e.text}
              </button>
            ))}
          </div>
        )}

        {phase === 'results' && (
          <div className="space-y-4">
            <h4 className="text-xl font-semibold text-gray-800">Round Results</h4>
            <ul className="space-y-2">
              {entries.map((e, idx) => (
                <li key={idx} className="bg-white border p-4 rounded-md shadow-sm">
                  <div className="text-gray-900 font-medium">{e.text}</div>
                  <div className="text-sm text-gray-500">Votes: {votes[e.id] || 0}</div>
                </li>
              ))}
            </ul>
            <h4 className="text-lg font-bold mt-6">Scores</h4>
            <ul className="grid grid-cols-2 gap-2">
              {Object.entries(scores).map(([player, score]) => (
                <li key={player} className="bg-blue-50 border p-2 rounded text-center text-blue-700 font-semibold">
                  {player}: {score} pts
                </li>
              ))}
            </ul>
          </div>
        )}

        {phase === 'waiting' && (
          <p className="text-gray-600 text-center italic">Waiting for next round...</p>
        )}
      </div>
    </div>
  )
}






