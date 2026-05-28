import React, { useEffect, useState } from "react";
import { userService } from "../services/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { Shield, Users, Trash2, UserPlus, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SuperAdminDashboard = () => {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyAdmins, setShowOnlyAdmins] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = () => {
    setLoading(true);
    userService.getAll()
      .then(data => {
        setAllUsers(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser || currentUser.role !== "super_admin") {
      navigate("/");
      return;
    }
    fetchUsers();
  }, [authLoading, currentUser, navigate]);

  useEffect(() => {
    let filtered = allUsers;
    if (showOnlyAdmins) {
      filtered = filtered.filter(u => u.role === 'admin' || u.role === 'super_admin');
    }
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredUsers(filtered);
  }, [allUsers, showOnlyAdmins, searchTerm]);

  if (authLoading || !currentUser || currentUser.role !== "super_admin") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  const handleRoleUpdate = async (id: number, role: string) => {
    try {
      await userService.updateRole(id, role);
      fetchUsers();
    } catch (err) {
      console.error("Lỗi cập nhật quyền:", err);
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await userService.delete(id);
      fetchUsers();
    } catch (err: any) {
      console.error("Lỗi xóa người dùng:", err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <ShieldAlert className="mr-3 h-8 w-8 text-purple-600" /> Hệ thống Siêu quản trị
        </h1>
        <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-bold text-sm">
          Toàn quyền hệ thống
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 flex items-center gap-4">
          <div className="bg-purple-50 p-4 rounded-2xl text-purple-600">
            <Users size={32} />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Tổng người dùng</div>
            <div className="text-2xl font-bold text-gray-900">{allUsers.length}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100 flex items-center gap-4">
          <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
            <Shield size={32} />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Quản trị viên</div>
            <div className="text-2xl font-bold text-gray-900">
              {allUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">Danh sách tài khoản</h2>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Users className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
            </div>
            <label className="flex items-center cursor-pointer gap-2 whitespace-nowrap">
              <input
                type="checkbox"
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                checked={showOnlyAdmins}
                onChange={(e) => setShowOnlyAdmins(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700">Chỉ hiện Admin</span>
            </label>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Người dùng</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Email</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Vai trò</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Ngày tham gia</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{u.full_name}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <select
                    className={`text-xs font-bold px-3 py-1 rounded-full border-none focus:ring-2 focus:ring-purple-500 outline-none ${
                      u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-gray-100 text-gray-700'
                    }`}
                    value={u.role}
                    onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                    disabled={u.id === currentUser?.id}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(u.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={u.id === currentUser?.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-20"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
