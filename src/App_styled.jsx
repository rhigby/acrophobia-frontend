import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io('https://acrophobia-backend-2.onrender.com', {
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

  useEffect(() => {
    socket.on('acronym', setAcronym)
    socket.on('phase', setPhase)
    socket.on('entries', setEntries)
    socket.on('votes', setVotes)
    socket.on('scores', setScores)
  }, [])

  const joinRoom = () => {
    if (!room || !username) return
    socket.emit('join_room', { room, username })
    setJoined(true)
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
          <h3 className="text-2xl mt-2 text-blue-800 font-bold tracking-wide">Acronym: {acronym}</h3>
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
