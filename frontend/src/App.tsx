import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ContactButton from './components/ContactButton';
import TierDatabasePage from './pages/TierDatabasePage';
import TeamBuildPage from './pages/TeamBuildPage';
import TeamListPage from './pages/TeamListPage';
import MatchRecordPage from './pages/MatchRecordPage';

function App() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<TierDatabasePage />} />
          <Route path="/team-build" element={<TeamBuildPage />} />
          <Route path="/teams" element={<TeamListPage />} />
          <Route path="/matches" element={<MatchRecordPage />} />
        </Routes>
      </main>
      <Footer />
      <ContactButton />
    </>
  );
}

export default App;
