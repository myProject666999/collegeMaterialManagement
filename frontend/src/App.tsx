import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import { getUserInfo } from './services/api';

const AdminDashboard = React.lazy(() => import('./pages/Dashboard'));
const MaterialPage = React.lazy(() => import('./pages/Material'));
const InventoryInPage = React.lazy(() => import('./pages/InventoryIn'));
const InventoryOutPage = React.lazy(() => import('./pages/InventoryOut'));
const StockPage = React.lazy(() => import('./pages/Stock'));
const ClaimPage = React.lazy(() => import('./pages/Claim'));
const StatisticsPage = React.lazy(() => import('./pages/Statistics'));
const TeacherPage = React.lazy(() => import('./pages/Teacher'));
const UserPage = React.lazy(() => import('./pages/User'));
const RolePage = React.lazy(() => import('./pages/Role'));
const MenuPage = React.lazy(() => import('./pages/Menu'));
const TeacherMaterialPage = React.lazy(() => import('./pages/TeacherMaterial'));
const TeacherClaimPage = React.lazy(() => import('./pages/TeacherClaim'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    const checkAuth = async () => {
      try {
        await getUserInfo();
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/material" replace />} />
        <Route path="material" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <MaterialPage />
          </React.Suspense>
        } />
        <Route path="inventory-in" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <InventoryInPage />
          </React.Suspense>
        } />
        <Route path="inventory-out" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <InventoryOutPage />
          </React.Suspense>
        } />
        <Route path="stock" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <StockPage />
          </React.Suspense>
        } />
        <Route path="claim" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <ClaimPage />
          </React.Suspense>
        } />
        <Route path="statistics" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <StatisticsPage />
          </React.Suspense>
        } />
        <Route path="teacher" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <TeacherPage />
          </React.Suspense>
        } />
        <Route path="user" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <UserPage />
          </React.Suspense>
        } />
        <Route path="role" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <RolePage />
          </React.Suspense>
        } />
        <Route path="menu" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <MenuPage />
          </React.Suspense>
        } />
        <Route path="teacher/material" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <TeacherMaterialPage />
          </React.Suspense>
        } />
        <Route path="teacher/claim" element={
          <React.Suspense fallback={<Spin size="large" />}>
            <TeacherClaimPage />
          </React.Suspense>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
