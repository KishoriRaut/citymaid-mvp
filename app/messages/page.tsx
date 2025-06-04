'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ChatUser {
  id: string;
  full_name: string;
  photo_url?: string | null;
  role: 'employer' | 'maid';
}

export default function Messages() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchChatUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${selectedUser.id} OR receiver_id=eq.${selectedUser.id}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            if (
              (newMessage.sender_id === currentUser?.id && newMessage.receiver_id === selectedUser.id) ||
              (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === currentUser?.id)
            ) {
              setMessages((prev) => [...prev, newMessage]);
              scrollToBottom();
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedUser, currentUser]);

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        router.push('/login');
        return;
      }

      // Check both maids and employers tables
      const [maidResult, employerResult] = await Promise.all([
        supabase
          .from('maids')
          .select('id')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('employers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()
      ]);

      let role = 'employer'; // Default role
      if (maidResult.data) {
        role = 'maid';
      } else if (employerResult.data) {
        role = 'employer';
      }

      setCurrentUser({ id: user.id, role });
    } catch (error) {
      console.error('Error checking user:', error);
      setError('Failed to authenticate user');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatUsers = async () => {
    try {
      if (!currentUser) return;

      // Get all users who have exchanged messages with the current user
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (messagesError) throw messagesError;

      // Get unique user IDs
      const userIds = new Set<string>();
      messages.forEach((msg) => {
        if (msg.sender_id !== currentUser.id) userIds.add(msg.sender_id);
        if (msg.receiver_id !== currentUser.id) userIds.add(msg.receiver_id);
      });

      // Fetch user details from both tables
      const [maidUsers, employerUsers] = await Promise.all([
        supabase
          .from('maids')
          .select('id, full_name')
          .in('id', Array.from(userIds)),
        supabase
          .from('employers')
          .select('id, full_name')
          .in('id', Array.from(userIds))
      ]);

      if (maidUsers.error) throw maidUsers.error;
      if (employerUsers.error) throw employerUsers.error;

      // Combine and format the users
      const users: ChatUser[] = [
        ...(maidUsers.data || []).map(user => ({ ...user, role: 'maid' as const, photo_url: null })),
        ...(employerUsers.data || []).map(user => ({ ...user, role: 'employer' as const, photo_url: null }))
      ];

      setChatUsers(users);
    } catch (error) {
      console.error('Error fetching chat users:', error);
      setError('Failed to load chat users');
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data as Message[]);
      scrollToBottom();

      // Mark unread messages as read
      const unreadMessages = data.filter(
        (msg) => msg.receiver_id === currentUser.id && !msg.is_read
      );

      if (unreadMessages.length > 0) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .in(
            'id',
            unreadMessages.map((msg) => msg.id)
          );

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    try {
      const { error } = await supabase.from('messages').insert([
        {
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          content: newMessage.trim(),
        },
      ]);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        {/* Chat Users List */}
        <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
            {chatUsers.length === 0 ? (
              <p className="text-gray-500 text-sm">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {chatUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                      selectedUser?.id === user.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {user.photo_url ? (
                          <img
                            src={user.photo_url}
                            alt={user.full_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">
                              {user.full_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  {selectedUser.photo_url ? (
                    <img
                      src={selectedUser.photo_url}
                      alt={selectedUser.full_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        {selectedUser.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {selectedUser.full_name}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize">{selectedUser.role}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === currentUser?.id
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
                <div ref={messagesEndRef} />
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
                <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a user from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 