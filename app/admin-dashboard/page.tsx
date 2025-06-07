'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface AdminMessage {
  id: string;
  admin_id: string;
  user_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_type: 'admin' | 'user';
  user: {
    email: string;
    full_name: string;
  };
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'maid' | 'employer';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string } | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (currentAdmin) {
      fetchUsers();
      fetchMessages();
    }
  }, [currentAdmin]);

  const checkAdmin = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is an admin
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();

      if (adminError || !admin) {
        router.push('/');
        return;
      }

      setCurrentAdmin({ id: admin.id });
    } catch (error) {
      console.error('Error checking admin:', error);
      setError('Failed to authenticate admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch users from both maids and employers tables
      const [maidUsers, employerUsers] = await Promise.all([
        supabase
          .from('maids')
          .select('id, email, full_name'),
        supabase
          .from('employers')
          .select('id, email, full_name')
      ]);

      if (maidUsers.error) throw maidUsers.error;
      if (employerUsers.error) throw employerUsers.error;

      const users: User[] = [
        ...(maidUsers.data || []).map(user => ({ ...user, role: 'maid' as const })),
        ...(employerUsers.data || []).map(user => ({ ...user, role: 'employer' as const }))
      ];

      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  };

  const fetchMessages = async () => {
    try {
      if (!currentAdmin) return;

      const { data, error } = await supabase
        .from('admin_messages')
        .select(`
          *,
          user:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data as AdminMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !currentAdmin) return;

    try {
      const { error } = await supabase.from('admin_messages').insert([
        {
          admin_id: currentAdmin.id,
          user_id: selectedUser.id,
          content: newMessage.trim(),
        },
      ]);

      if (error) throw error;

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex h-[calc(100vh-12rem)]">
        {/* Users List */}
        <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Users</h2>
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                    selectedUser?.id === user.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email} • {user.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Messages Header */}
              <div className="border-b border-gray-200 p-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {selectedUser.full_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedUser.email} • {selectedUser.role}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages
                  .filter(msg => msg.user_id === selectedUser.id)
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_type === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="border-t border-gray-200 p-4">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Select a user</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a user from the list to view and send messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 