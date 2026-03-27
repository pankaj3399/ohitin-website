import React, { Suspense } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = React.lazy(() => import('../pages/home'));

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Router;
