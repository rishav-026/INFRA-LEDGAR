import { PageLayout } from '../components/layout/PageLayout';
import { UserTable } from '../components/admin/UserTable';

export default function AdminPanel() {
  return (
    <PageLayout maxWidth="max-w-4xl">
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-text-primary">Admin Panel</h1>
        <UserTable />
      </div>
    </PageLayout>
  );
}
