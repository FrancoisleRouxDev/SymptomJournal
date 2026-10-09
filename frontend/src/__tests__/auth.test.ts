import { signUp, signIn, signOut, getCurrentUser, updateUserProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

describe('Auth Utilities (src/lib/auth.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should call supabase.auth.signUp with name in user metadata and return data on success', async () => {
      const mockData = { user: { id: 'usr-123', email: 'test@example.com' }, session: null };
      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const result = await signUp('John Doe', 'test@example.com', 'password123');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { name: 'John Doe' },
        },
      });
      expect(result).toEqual(mockData);
    });

    it('should throw an error if supabase.auth.signUp returns an error', async () => {
      const authError = new Error('User already registered');
      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: authError,
      });

      await expect(signUp('Jane', 'existing@example.com', 'pass123')).rejects.toThrow('User already registered');
    });
  });

  describe('signIn', () => {
    it('should authenticate user with email and password and return session data', async () => {
      const mockData = {
        user: { id: 'usr-456' },
        session: { access_token: 'fake-jwt-token' },
      };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const result = await signIn('test@example.com', 'secret');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret',
      });
      expect(result).toEqual(mockData);
    });

    it('should throw an error on invalid credentials', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: new Error('Invalid login credentials'),
      });

      await expect(signIn('wrong@example.com', 'badpass')).rejects.toThrow('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('should sign out the user without errors', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({ error: null });

      await expect(signOut()).resolves.toBeUndefined();
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should throw if signOut fails', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({
        error: new Error('Network error during signout'),
      });

      await expect(signOut()).rejects.toThrow('Network error during signout');
    });
  });

  describe('getCurrentUser', () => {
    it('should retrieve current authenticated user', async () => {
      const mockUser = { id: 'usr-789', email: 'me@example.com' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const user = await getCurrentUser();
      expect(user).toEqual(mockUser);
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    it('should return null if no user is signed in', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user metadata with custom attributes', async () => {
      const attributes = {
        name: 'Updated Name',
        phone: '+1234567890',
        doctor: 'Dr. Smith',
        conditions: 'Migraine',
      };
      const mockData = { user: { id: 'usr-1', user_metadata: attributes } };

      (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const result = await updateUserProfile(attributes);

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: attributes,
      });
      expect(result).toEqual(mockData);
    });

    it('should throw if updateUser returns an error', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: new Error('Update failed'),
      });

      await expect(updateUserProfile({ name: 'Fail' })).rejects.toThrow('Update failed');
    });
  });
});
