import { AdminTabs } from '@/components/admin/admin-tabs';

export default function AdminPage() {
  return (
    <main className="container mx-auto px-6 py-8">
      <h1 className="text-3xl text-primary mb-6">Admin</h1>
      <AdminTabs />
    </main>
  );
}
