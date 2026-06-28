import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Explore from './pages/Explore'
import Leaderboard from './pages/Leaderboard'
import Governance from './pages/Governance'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="profile/:address" element={<Profile />} />
        <Route path="explore" element={<Explore />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="governance" element={<Governance />} />
      </Route>
    </Routes>
  )
}

export default App