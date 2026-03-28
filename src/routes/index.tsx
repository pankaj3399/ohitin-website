import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const Home = React.lazy(() => import('../pages/home'));

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
      </Routes>
    </AnimatePresence>
  );
}

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <AnimatedRoutes />
      </Suspense>
    </BrowserRouter>
  );
};

export default Router;
