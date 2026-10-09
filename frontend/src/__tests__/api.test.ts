import api from '@/lib/api';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

describe('API Client & Interceptors (src/lib/api.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Interceptor', () => {
    it('should attach Authorization Bearer token when a valid session exists', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'test-supabase-jwt-token',
          },
        },
      });

      // Find the request interceptor handler
      const requestInterceptor = (api.interceptors.request as any).handlers[0];
      const initialConfig: any = { headers: {} };

      const updatedConfig = await requestInterceptor.fulfilled(initialConfig);

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(updatedConfig.headers.Authorization).toBe('Bearer test-supabase-jwt-token');
    });

    it('should not attach Authorization header when no session exists', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: {
          session: null,
        },
      });

      const requestInterceptor = (api.interceptors.request as any).handlers[0];
      const initialConfig: any = { headers: {} };

      const updatedConfig = await requestInterceptor.fulfilled(initialConfig);

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(updatedConfig.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor Error Handling', () => {
    const responseInterceptor = (api.interceptors.response as any).handlers[0];

    it('should pass through successful responses unchanged', () => {
      const mockResponse = { status: 200, data: { success: true } };
      const result = responseInterceptor.fulfilled(mockResponse);
      expect(result).toBe(mockResponse);
    });

    it('should format 429 rate limit errors with user-friendly message', () => {
      const error429 = {
        response: {
          status: 429,
          data: 'Too Many Requests',
        },
      };

      expect(() => responseInterceptor.rejected(error429)).toThrow(
        'Too many requests — please wait a moment and try again.'
      );
    });

    it('should format 401 unauthorized errors with session expired message', () => {
      const error401 = {
        response: {
          status: 401,
          data: 'Unauthorized',
        },
      };

      expect(() => responseInterceptor.rejected(error401)).toThrow(
        'Session expired — please sign in again.'
      );
    });

    it('should re-throw unrecognized errors without modification', () => {
      const genericError = new Error('Network timeout');
      expect(() => responseInterceptor.rejected(genericError)).toThrow('Network timeout');
    });
  });
});
