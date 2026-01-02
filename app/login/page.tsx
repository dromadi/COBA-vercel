import { Suspense } from 'react';
import LoginForm from './LoginForm';

function LoginFallback() {
  return (
    <main className="container py-5" style={{ maxWidth: 980 }}>
      <div className="p-4 card-glass">Memuat halaman login...</div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
