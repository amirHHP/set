import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getCoachDashboardData } from '@/app/actions/coach';
import CoachPanelClient from '@/components/CoachPanelClient';

export default async function CoachPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'coach' && currentUser.role !== 'admin') {
    redirect('/');
  }

  const res = await getCoachDashboardData();
  const initialData = res.success && res.data ? res.data : null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 0 60px' }}>
      <CoachPanelClient initialData={initialData} currentUserId={currentUser.id} />
    </div>
  );
}
