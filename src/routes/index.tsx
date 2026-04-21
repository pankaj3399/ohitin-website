import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from '../admin/auth/AuthContext';
import { ProtectedAdminRoute } from '../admin/routes/ProtectedAdminRoute';

const Home = React.lazy(() => import('../pages/home'));
const AdminLoginPage = React.lazy(() => import('../admin/pages/AdminLoginPage'));
const AdminDashboardPage = React.lazy(
  () => import('../admin/pages/AdminDashboardPage')
);
const AdminAnalyticsPage = React.lazy(
  () => import('../admin/pages/AdminAnalyticsPage')
);
const InstagramConversationsPage = React.lazy(
  () => import('../admin/pages/InstagramConversationsPage')
);
const InstagramLeadsPage = React.lazy(
  () => import('../admin/pages/InstagramLeadsPage')
);
const AdminSettingsPage = React.lazy(
  () => import('../admin/pages/AdminSettingsPage')
);

const ROUTE_TRANSITION = {
  duration: 0.8,
  ease: [0.42, 0.02, 0.51, 1] as const,
};

function AnimatedRoutes() {
  const location = useLocation();

  const renderScene = (scene: 1 | 2 | 3) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={ROUTE_TRANSITION}
      className="min-h-screen"
    >
      <Home scene={scene} />
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={renderScene(1)} />
        <Route path="/about-the-film" element={renderScene(2)} />
        <Route path="/why-this-film" element={renderScene(3)} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/instagram" element={<InstagramConversationsPage />} />
          <Route path="/admin/instagram/leads" element={<InstagramLeadsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
          <AnimatedRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Router;
