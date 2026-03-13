import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { getUsers, updateUserRole } from '../../services/api';
import { RoleBadge } from '../ui/Badge';
import type { User, UserRole } from '../../types';
import { useToastContext } from '../../context/ToastContext';

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const { addToast } = useToastContext();

  useEffect(() => {
    getUsers().then((res) => setUsers(res));
  }, []);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleSave = async (user: User) => {
    const previous = [...users];
    try {
      await updateUserRole(user.id, user.role);
      addToast('success', `Role updated for ${user.email}`);
    } catch {
      setUsers(previous);
      addToast('error', `Failed to update role for ${user.email}`);
    }
  };

  return (
    <Card header={<h3 className="text-sm font-semibold">User Management</h3>} padding="none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Email</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Current Role</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Change Role</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-xs text-text-muted">{user.displayName}</p>
                  </div>
                </td>
                <td className="py-3 px-4"><RoleBadge role={user.role} /></td>
                <td className="py-3 px-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="text-sm border border-border rounded-lg px-2 py-1 bg-white"
                  >
                    <option value="government">Government</option>
                    <option value="contractor">Contractor</option>
                    <option value="citizen">Citizen</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <Button size="sm" variant="secondary" onClick={() => handleSave(user)}>Save</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-surface-secondary text-xs text-text-muted border-t border-border">
        Roles take effect on next login.
      </div>
    </Card>
  );
}
