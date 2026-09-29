import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Public registration is disabled as requested by the store administrator.
  redirect('/login');
}
