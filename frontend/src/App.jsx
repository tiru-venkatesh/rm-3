import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase.js';
import { useAuth } from './store/index.js';

import Layout           from './components/layout/Layout.jsx';
import AuthPage         from './pages/AuthPage.jsx';
import ChatPage         from './pages/ChatPage.jsx';
import ImagePage        from './pages/ImagePage.jsx';
import BlenderPage      from './pages/BlenderPage.jsx';
import PipelinePage     from './pages/PipelinePage.jsx';
import ScenePlannerPage from './pages/ScenePlannerPage.jsx';
import ProfilePage      from './pages/ProfilePage.jsx';

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: '#07070c' }}>
      <div className="w-5 h-5 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(124,58,237,0.3)', borderTopColor: '#7c3aed' }} />
    </div>
  );
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const { setUser } = useAuth();
  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index element={<Navigate to="/scene" replace />} />
          <Route path="scene"    element={<ScenePlannerPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="chat"     element={<ChatPage />} />
          <Route path="chat/:id" element={<ChatPage />} />
          <Route path="images"   element={<ImagePage />} />
          <Route path="blender"  element={<BlenderPage />} />
          <Route path="profile"  element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
