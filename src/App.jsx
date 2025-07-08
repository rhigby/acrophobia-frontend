import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'

const socket = io('https://acrophobia-backend-2.onrender.com')

const predefinedRooms = Array.from({ length: 10 }, (_, i) => `room${i + 1}`)

export default function AcrophobiaLobby() {
  const [username, setUsername] = useState('')
  const [room, setRoom] = useState(null)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState(null)
  const [players, setPlayers] = useState([])

  const [acronym, setAcronym] = useState('')
  const [entries, setEntries] = useState([])
  const [submission, setSubmission] = useState('')
  const [phase, setPhase] = useState('waiting')
  const [votes, setVotes] = useState({})
  const [scores, setScores] = useState({})
  const [countdown, setCountdown] = useState(null)
  const [round, setRound] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [showOverlay, setShowOverlay] = useState(true)

  useEffect(() => {
    socket.on('connect', () => console.log('✅ Connected to socket server'))
    socket.on('disconnect', () => console.log('❌ Disconnected from socket server'))

    socket.on('acronym', setAcronym)
    socket.on('phase', setPhase)
    socket.on('entries', setEntries)
    socket.on('votes', setVotes)
    socket.on('scores', setScores)
    socket.on('round_number', (r) => {
      setRound(r)
      setShowOverlay(true)
      setTimeout(() => setShowOverlay(false), 3000)
    })
    socket.on('countdown', setCountdown)
    socket.on('player_joined', setPlayers)
    socket.on('room_full', () => setError('Room is full'))
    socket.on('invalid_room', () => setError('Invalid room'))
    socket.on('game_over', ({ scores, winner }) => {
      setScores(scores)
      setWinner(winner)
      setGameOver(true)
    })
    socket.on('beep', () => {
      const beep = new Audio('/beep.mp3')
      beep.play().catch(err => console.error('Beep error:', err))
    })

    return () => {
      socket.off()
    }
  }, [])

  const joinRoom = (roomId) => {
    if (!username) {
      setError('Please enter your name')
      return
    }
    socket.emit('join_room', { room: roomId, username })
    setRoom(roomId)
    setJoined(true)
    setError(null)
  }

  const submitEntry = () => {
    if (!submission) return
    socket.emit('submit_entry', { room, username, text: submission })
    setSubmission('')
  }

  const voteEntry = (entryId) => {
    socket.emit('vote_entry', { room, username, entryId })
  }

  if (!joined) {
    return (
      <div className="p-6 max-w-xl mx-auto bg-blue-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-4">🧠 Acrophobia Lobby</h1>
        <input
          className="border p-2 w-full mb-4"
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <h2 className="text-xl font-semibold mb-2">Join a Room</h2>
        <div className="grid grid-cols-2 gap-2">
          {predefinedRooms.map((r) => (
            <button
              key={r}
              onClick={() => joinRoom(r)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              {r}
            </button>
          ))}
        </div>
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex max-w-4xl mx-auto bg-blue-50 min-h-screen relative">
      {showOverlay && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center text-white text-4xl font-bold animate-fadeIn">
          Round {round}
        </div>
      )}

      <div className="w-1/4 p-4 border-r bg-white">
        <h3 className="font-bold mb-2">Players</h3>
        <ul className="space-y-1">
          {players.map(p => (
            <li key={p} className="text-sm flex justify-between">
              <span>{p}</span>
              <span>{scores[p] || 0} pts</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-3/4 p-6 relative">
        {countdown !== null && (
          <div className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-full text-lg shadow-lg z-50">
            ⏳ {countdown}s
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-1">Room: {room} — Round {round}</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Results:</div>
          <div className="flex space-x-2">
            {acronym.split('').map((char, idx) => (
              <motion.span
                key={idx}
                className="w-10 h-10 bg-blue-800 text-white flex items-center justify-center font-mono text-lg rounded shadow-md"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ delay: idx * 0.2, duration: 0.5 }}
              >
                {char}
              </motion.span>
            ))}
          </div>
        </div>

        {phase === 'submit' && (
          <div className="space-y-2">
            <textarea className="border p-2 w-full" placeholder="Your acronym meaning..." value={submission} onChange={(e) => setSubmission(e.target.value)} />
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={submitEntry}>Submit</button>
          </div>
        )}

        {phase === 'vote' && (
          <div className="space-y-2">
            <h4 className="font-semibold">Vote for your favorite:</h4>
            {entries.map((e, idx) => (
              <button key={idx} className="block w-full border rounded p-2 hover:bg-gray-100" onClick={() => voteEntry(e.id)}>
                {e.text}
              </button>
            ))}
          </div>
        )}

        {phase === 'results' && (
          <div>
            <ul className="space-y-1">
              {entries.map((e, idx) => {
                console.log('Entry ID:', e.id, 'Votes object:', votes)
                return (
                  <li key={idx} className="border rounded p-2 flex justify-between items-center">
                    <div className="font-medium text-gray-800">{e.username}</div>
                    <div className="text-gray-900 font-semibold">{e.text}</div>
                    <div className="text-sm text-gray-600">Votes: {votes[e.id] || 0}</div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {phase === 'waiting' && <p className="text-gray-600 italic">Waiting for next round...</p>}

        {gameOver && (
          <div className="fixed bottom-4 left-4 bg-green-700 text-white px-4 py-2 rounded shadow-lg">
            🎉 Game Over! Winner: <strong>{winner}</strong>
          </div>
        )}
      </div>
    </div>
  )
}


















