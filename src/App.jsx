import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001') // change if deployed

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
  const [countdown, setCountdown] = useState(null)
  const [round, setRound] = useState(0)

  useEffect(() => {
    socket.on('acronym', setAcronym)
    socket.on('phase', setPhase)
    socket.on('entries', setEntries)
    socket.on('votes', setVotes)
    socket.on('scores', setScores)
    socket.on('round_number', setRound)
    socket.on('countdown', setCountdown)
    socket.on('beep', () => {
      const beep = new Audio('/beep.mp3')
      beep.play().catch(err => console.error('Beep error:', err))
    })

    return () => {
      socket.off('acronym')
      socket.off('phase')
      socket.off('entries')
      socket.off('votes')
      socket.off('scores')
      socket.off('round_number')
      socket.off('countdown')
      socket.off('beep')
    }
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
    <div className="p-6 max-w-2xl mx-auto relative bg-blue-50 min-h-screen">
      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white text-lg font-mono px-4 py-2 rounded-full shadow-lg">
          ⏳ {countdown}s
        </div>
      )}

      {!joined ? (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-center">Join Acrophobia</h1>
          <input className="border p-2 w-full" placeholder="Room Code" value={room} onChange={(e) => setRoom(e.target.value)} />
          <input className="border p-2 w-full" placeholder="Your Name" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" onClick={joinRoom}>Join Game</button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Room: {room} — Round {round}</h2>
          <h3 className="text-xl">Acronym: <span className="font-mono text-blue-800">{acronym}</span></h3>

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
              <h4 className="font-semibold">Results:</h4>
              <ul className="space-y-1">
                {entries.map((e, idx) => (
                  <li key={idx} className="border rounded p-2">
                    <div>{e.text}</div>
                    <div className="text-sm text-gray-600">Votes: {votes[e.id] || 0}</div>
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

          {phase === 'waiting' && <p className="text-gray-600 italic">Waiting for next round...</p>}
        </div>
      )}
    </div>
  )
}













