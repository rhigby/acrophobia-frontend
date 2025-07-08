import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

const socket = io('https://acrophobia-backend-2.onrender.com')

const PREMADE_ROOMS = Array.from({ length: 10 }, (_, i) => `Room-${i + 1}`)

export default function AcrophobiaGame() {
  const [room, setRoom] = useState('')
  const [username, setUsername] = useState('')
  const [joined, setJoined] = useState(false)
  const [acronym, setAcronym] = useState('')
  const [displayedAcronym, setDisplayedAcronym] = useState('')
  const [entries, setEntries] = useState([])
  const [submission, setSubmission] = useState('')
  const [phase, setPhase] = useState('waiting')
  const [votes, setVotes] = useState({})
  const [scores, setScores] = useState({})
  const [round, setRound] = useState(1)
  const acronymInterval = useRef(null)

  useEffect(() => {
    socket.on('acronym', (newAcronym) => {
      setAcronym(newAcronym)
      setDisplayedAcronym('')
      let index = 0
      clearInterval(acronymInterval.current)
      acronymInterval.current = setInterval(() => {
        index++
        setDisplayedAcronym((prev) => newAcronym.slice(0, index))
        if (index >= newAcronym.length) {
          clearInterval(acronymInterval.current)
        }
      }, 400)
    })

    socket.on('phase', setPhase)
    socket.on('entries', setEntries)
    socket.on('votes', setVotes)
    socket.on('scores', setScores)
    socket.on('round_number', setRound)
  }, [])

  const joinRoom = (selectedRoom) => {
    if (!selectedRoom || !username) return
    setRoom(selectedRoom)
    socket.emit('join_room', { room: selectedRoom, username })
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

  return (
    <div className="min-h-screen bg-blue-50 text-gray-900 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        {!joined ? (
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold text-blue-600 text-center">Welcome to Acrophobia</h1>
            <input className="border border-gray-300 p-2 w-full rounded" placeholder="Your Name" value={username} onChange={(e) => setUsername(e.target.value)} />
            <h2 className="text-lg font-semibold text-center">Choose a Room</h2>
            <div className="grid grid-cols-2 gap-3">
              {PREMADE_ROOMS.map((roomName) => (
                <button
                  key={roomName}
                  onClick={() => joinRoom(roomName)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded shadow text-sm font-medium"
                >
                  {roomName}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Room: <span className="text-blue-600">{room}</span></h2>
              <h3 className="text-lg">Round <span className="font-bold">{round}</span></h3>
            </div>

            <div className="flex justify-center gap-2 mb-4">
              {[...displayedAcronym].map((char, idx) => (
                <div key={idx} className="w-12 h-12 bg-blue-100 text-blue-600 font-mono font-bold flex items-center justify-center rounded shadow text-xl animate-fade-in">
                  {char}
                </div>
              ))}
            </div>

            {phase === 'submit' && (
              <div className="space-y-3">
                <textarea
                  className="border border-gray-300 p-2 w-full rounded resize-none h-24"
                  placeholder="Enter your creative acronym expansion..."
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                />
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" onClick={submitEntry}>Submit</button>
              </div>
            )}

            {phase === 'vote' && (
              <div className="space-y-2">
                <h4 className="font-semibold mb-2">Vote for your favorite:</h4>
                {entries.map((e, idx) => (
                  <button
                    key={idx}
                    className="block w-full border border-gray-300 rounded p-2 hover:bg-gray-100 text-left"
                    onClick={() => voteEntry(e.id)}>
                    {e.text}
                  </button>
                ))}
              </div>
            )}

            {phase === 'results' && (
              <div>
                <h4 className="font-semibold mb-2">Results:</h4>
                <ul className="space-y-2">
                  {entries.map((e, idx) => (
                    <li key={idx} className="border rounded p-3 bg-gray-50">
                      <div className="font-medium">{e.text}</div>
                      <div className="text-sm text-gray-600">Votes: {votes[e.id] || 0}</div>
                    </li>
                  ))}
                </ul>
                <h4 className="mt-4 font-bold">Current Scores:</h4>
                <ul className="mt-2">
                  {Object.entries(scores).map(([player, score]) => (
                    <li key={player} className="text-sm">{player}: {score} pts</li>
                  ))}
                </ul>
              </div>
            )}

            {phase === 'waiting' && <p className="text-gray-600 text-center italic">Waiting for next round...</p>}
          </div>
        )}
      </div>
    </div>
  )
}












