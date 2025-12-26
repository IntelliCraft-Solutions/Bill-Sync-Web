'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    const loginDemo = async () => {
      // For demo, we can use a pre-created demo account or a special flag
      // Here we'll try to sign in with demo credentials
      const result = await signIn('credentials', {
        email: 'demo@bill-sync.com',
        password: 'demo_password_123',
        redirect: false,
      });

      if (result?.ok) {
        router.push('/admin/dashboard');
      } else {
        // If demo user doesn't exist, we might need to create it first in a real scenario
        // but for this prompt we assume it exists or the system handles it
        console.error('Demo login failed');
        router.push('/auth/signin?error=Demo login failed');
      }
    };

    loginDemo();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-white mb-2">Setting up Demo Account...</h1>
        <p className="text-gray-400">Please wait while we prepare your sandbox environment.</p>
      </div>
    </div>
  );
}
