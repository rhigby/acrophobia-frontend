import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001') // Update to your Render backend URL if needed

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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {!joined ? (
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Join Acrophobia</h1>
          <input className="border p-2 w-full" placeholder="Room Code" value={room} onChange={(e) => setRoom(e.target.value)} />
          <input className="border p-2 w-full" placeholder="Your Name" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={joinRoom}>Join Game</button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold">Room: {room}</h2>
          <h3 className="text-lg mb-2">Acronym: <span className="font-mono text-blue-600">{acronym}</span></h3>

          {phase === 'submit' && (
            <div className="space-y-2">
              <textarea className="border p-2 w-full" placeholder="Your acronym meaning..." value={submission} onChange={(e) => setSubmission(e.target.value)} />
              <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={submitEntry}>Submit</button>
            </div>
          )}

          {phase === 'vote' && (
            <div className="space-y-2">
              <h4 className="font-semibold mb-2">Vote:</h4>
              {entries.map((e, idx) => (
                <button key={idx} className="block w-full border rounded p-2 hover:bg-gray-100" onClick={() => voteEntry(e.id)}>{e.text}</button>
              ))}
            </div>
          )}

          {phase === 'results' && (
            <div>
              <h4 className="font-semibold mb-2">Results:</h4>
              <ul className="space-y-1">
                {entries.map((e, idx) => (
                  <li key={idx} className="border rounded p-2">
                    <span className="block">{e.text}</span>
                    <span className="text-sm text-gray-600">Votes: {votes[e.id] || 0}</span>
                  </li>
                ))}
              </ul>
              <h4 className="mt-4 font-bold">Scores:</h4>
              <ul>
                {Object.entries(scores).map(([player, score]) => (
                  <li key={player}>{player}: {score} pts</li>
                ))}
              </ul>
            </div>
          )}

          {phase === 'waiting' && <p className="text-gray-600">Waiting for next round...</p>}
        </div>
      )}
    </div>
  )
}
