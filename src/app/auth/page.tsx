"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Ambil CSRF Cookie dari Laravel terlebih dahulu
      await api.get('/sanctum/csrf-cookie', {
        baseURL: process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'
      });

      // 2. Lakukan proses login (Cookie akan tertanam otomatis jika sukses)
      const response = await api.post('/login', {
        email: email,
        password: password
      });

      const data = response.data;
      if (data.success) {

        // HANYA simpan profil user untuk keperluan render UI (bukan untuk auth)
        // localStorage.setItem('token', ...); <-- DIHAPUS KARENA SUDAH PAKAI COOKIE
        localStorage.setItem('user', JSON.stringify(data.user));

        // PENTING: Simpan role di cookie agar Middleware bisa baca
        document.cookie = `role=${data.user.role}; path=/; max-age=86400`;
        const role = data.user.role;
        if (role === 'mentor') {
          router.push('/mentor');
        } else if (role === 'teacher') {
          router.push('/teacher');
        } else if (role === 'parent') {
          router.push('/parent');
        } else if (role === 'admin') {
          router.push('/admin');
        }
      }
    } catch (err: any) {

      if (err.response && err.response.data) {
        const rawMessage = err.response.data.message || '';
        
        // Cek jika status 500 atau pesan mengandung kata kunci sensitif seputar database/koneksi
        const isSensitive = 
          err.response.status === 500 || 
          /SQLSTATE|mysql|database|connection|query|refused|driver|pdo/i.test(rawMessage);

        if (isSensitive) {
          setError('Terjadi kendala teknis pada server. Silakan hubungi administrator.');
        } else {
          setError(rawMessage || 'Login failed. Please check your credentials.');
        }
      } else {
        setError('Connection failed. Is the backend server running?');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">E-Report</h1>
          <p className="mt-2 text-sm text-gray-600">Singapore School Piaget Academic</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md border border-transparent bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors disabled:bg-brand-300"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}