// This is the main mock Supabase client object.
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    order: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
  })),
  rpc: jest.fn(),
};

// This is the mock for the createClient function.
// It returns our mockSupabaseClient instance.
export const createClient = jest.fn(() => mockSupabaseClient);
