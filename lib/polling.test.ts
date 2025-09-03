import { jest } from "@jest/globals";
import {
  SupabaseClient,
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";

export const mockSupabaseClient = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
  rpc: jest.fn(),
} as unknown as SupabaseClient;

// Set up environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

// Mock Supabase client

// Mock the createClient function before importing the polling module
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Next.js modules
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({})),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/supabase/server");

// Now import the functions after mocks are set up
import {
  getPolls,
  getPollById,
  castVote,
  deleteVote,
  updatePollQuestion,
} from "./polling";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export function mockSupabaseResponse<T>(
  data: T | null,
  error: any = null,
): PostgrestSingleResponse<T> {
  return {
    data,
    error,
    count: null,
    status: 200,
    statusText: "OK",
  } as PostgrestSingleResponse<T>;
}

const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe("Polling Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe("getPolls", () => {
    it("should return empty array when user is not authenticated", async () => {
      (
        mockSupabaseClient.auth.getUser as jest.MockedFunction<any>
      ).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getPolls();

      expect(result).toEqual([]);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
    });

    it("should return empty array when getUserError occurs", async () => {
      (
        mockSupabaseClient.auth.getUser as jest.MockedFunction<any>
      ).mockResolvedValue({
        data: { user: null },
        error: { message: "Auth error" },
      });

      const result = await getPolls();

      expect(result).toEqual([]);
    });

    it("should return polls with vote counts for authenticated user", async () => {
      const mockUser = { id: "user-123" };
      const mockPolls = [
        { id: "poll-1", question: "Test Question 1", created_at: "2025-01-01" },
        { id: "poll-2", question: "Test Question 2", created_at: "2025-01-02" },
      ];
      const mockVoteCounts = [
        { poll_id: "poll-1", vote_count: 5 },
        { poll_id: "poll-1", vote_count: 3 },
        { poll_id: "poll-2", vote_count: 2 },
      ];

      (mockSupabaseClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const fromMock = mockSupabaseClient.from as jest.MockedFunction<
        typeof mockSupabaseClient.from
      >;

      // Mock polls query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: mockPolls,
            error: null,
          },
        ),
      } as any);

      // Mock vote counts query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: mockVoteCounts,
            error: null,
          },
        ),
      } as any);

      const result = await getPolls();

      expect(result).toEqual([
        { ...mockPolls[0], totalVotes: 8 }, // 5 + 3
        { ...mockPolls[1], totalVotes: 2 },
      ]);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith("polls");
      expect(fromMock).toHaveBeenCalledWith("poll_option_counts");
    });

    it("should handle vote counts fetch error gracefully", async () => {
      const mockUser = { id: "user-123" };
      const mockPolls = [
        { id: "poll-1", question: "Test Question 1", created_at: "2025-01-01" },
      ];

      // @ts-expect-error: mockResolvedValue argument type mismatch for test
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const fromMock = mockSupabaseClient.from as jest.MockedFunction<
        typeof mockSupabaseClient.from
      >;

      // Mock polls query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: mockPolls,
            error: null,
          },
        ),
      } as any);

      // Mock vote counts query with error
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: null,
            error: { message: "Vote counts error" },
          },
        ),
      } as any);

      const result = await getPolls();

      expect(result).toEqual([{ ...mockPolls[0], totalVotes: 0 }]);
    });
  });

  describe("getPollById", () => {
    const mockPoll = {
      id: "poll-1",
      question: "Test Question",
      description: "Test Description",
      created_at: "2025-01-01",
      owner_id: "owner-123",
    };

    const mockOptions = [
      { id: "option-1", label: "Option 1", poll_id: "poll-1" },
      { id: "option-2", label: "Option 2", poll_id: "poll-1" },
    ];

    it("should return null when poll is not found", async () => {
      (
        mockSupabaseClient.auth.getUser as jest.MockedFunction<any>
      ).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const fromMock = mockSupabaseClient.from as jest.MockedFunction<
        typeof mockSupabaseClient.from
      >;
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: null,
            error: { message: "Poll not found" },
          },
        ),
      } as any);

      const result = await getPollById("poll-1");

      expect(result).toBeNull();
    });

    it("should return poll data with voting status for authenticated user", async () => {
      const mockUser = { id: "user-123" };
      const mockVoteCounts = [
        { option_id: "option-1", vote_count: 5 },
        { option_id: "option-2", vote_count: 3 },
      ];

      (
        mockSupabaseClient.auth.getUser as jest.MockedFunction<any>
      ).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const fromMock = mockSupabaseClient.from as jest.MockedFunction<any>;

      // Mock poll query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: mockPoll,
            error: null,
          },
        ),
      } as any);

      // Mock vote check query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: null, // User hasn't voted
            error: null,
          },
        ),
      } as any);

      // Mock options query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: mockOptions,
            error: null,
          },
        ),
      } as any);

      // Mock vote counts query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: mockVoteCounts,
            error: null,
          },
        ),
      } as any);

      const result = await getPollById("poll-1");

      expect(result).toEqual({
        id: "poll-1",
        question: "Test Question",
        description: "Test Description",
        created_at: "2025-01-01",
        options: [
          { id: "option-1", text: "Option 1", votes: 5 },
          { id: "option-2", text: "Option 2", votes: 3 },
        ],
        totalVotes: 8,
        hasVoted: false,
        isOwner: false,
      });
    });

    it("should correctly identify poll owner", async () => {
      const mockUser = { id: "owner-123" }; // Same as poll owner_id

      (
        mockSupabaseClient.auth.getUser as jest.MockedFunction<any>
      ).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const fromMock = mockSupabaseClient.from as jest.MockedFunction<any>;

      // Mock poll query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: mockPoll,
            error: null,
          },
        ),
      } as any);

      // Mock vote check query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: null,
            error: null,
          },
        ),
      } as any);

      // Mock options query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: mockOptions,
            error: null,
          },
        ),
      } as any);

      // Mock vote counts query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: [],
            error: null,
          },
        ),
      } as any);

      const result = await getPollById("poll-1");

      expect(result?.isOwner).toBe(true);
    });

    it("should detect when user has voted", async () => {
      const mockUser = { id: "user-123" };

      // @ts-expect-error: mockResolvedValue argument type mismatch for test
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const fromMock = mockSupabaseClient.from as jest.MockedFunction<
        typeof mockSupabaseClient.from
      >;

      // Mock poll query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: mockPoll,
            error: null,
          },
        ),
      } as any);

      // Mock vote check query - user has voted
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: { id: "vote-123" }, // Vote exists
            error: null,
          },
        ),
      } as any);

      // Mock options query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: mockOptions,
            error: null,
          },
        ),
      } as any);

      // Mock vote counts query
      fromMock.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue(
          // @ts-expect-error: mockResolvedValue argument type mismatch for test
          {
            data: [],
            error: null,
          },
        ),
      } as any);

      const result = await getPollById("poll-1");

      expect(result?.hasVoted).toBe(true);
    });
  });

  describe("castVote", () => {
    it("should cast vote successfully", async () => {
      (mockSupabaseClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      (mockSupabaseClient.rpc as jest.Mock).mockResolvedValue({ error: null });

      const result = await castVote("poll-1", "option-1");

      expect(result).toEqual({
        success: true,
        message: "Vote cast successfully!",
      });
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("cast_vote", {
        p_poll_id: "poll-1",
        p_option_id: "option-1",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/polls/poll-1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/polls");
    });

    it("should handle vote casting error", async () => {
      (mockSupabaseClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      (mockSupabaseClient.rpc as jest.Mock).mockResolvedValue({
        error: { message: "Vote casting failed" },
      });

      const result = await castVote("poll-1", "option-1");

      expect(result).toEqual({
        success: false,
        message: "Vote casting failed",
      });
    });

    it("should handle error without message", async () => {
      (mockSupabaseClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      (mockSupabaseClient.rpc as jest.Mock).mockResolvedValue({
        error: { code: "SOME_ERROR" },
      });

      const result = await castVote("poll-1", "option-1");

      expect(result).toEqual({
        success: false,
        message: "Failed to cast vote.",
      });
    });
  });

  const mockRedirect = jest.fn();
  const mockRevalidatePath = jest.fn();

  describe("deleteVote", () => {
    it("should delete poll successfully", async () => {
      const matchMock = jest.fn().mockResolvedValue({ error: null });
      const deleteMock = jest.fn().mockReturnValue({ match: matchMock });
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        delete: deleteMock,
      });

      const result = await deleteVote("poll-1");

      expect(result).toEqual({
        success: true,
        message: "Poll deleted successfully.",
      });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("polls");
      expect(deleteMock).toHaveBeenCalled();
      expect(matchMock).toHaveBeenCalledWith({ id: "poll-1" });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/polls");
    });

    it("should handle delete error", async () => {
      const matchMock = jest
        .fn()
        .mockResolvedValue({ error: { message: "Delete failed" } });
      const deleteMock = jest.fn().mockReturnValue({ match: matchMock });
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        delete: deleteMock,
      });

      const result = await deleteVote("poll-1");

      expect(result).toEqual({
        success: false,
        message: "Delete failed",
      });
    });

    it("should handle error without message", async () => {
      const matchMock = jest
        .fn()
        .mockResolvedValue({ error: { code: "SOME_ERROR" } });
      const deleteMock = jest.fn().mockReturnValue({ match: matchMock });
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        delete: deleteMock,
      });

      const result = await deleteVote("poll-1");

      expect(result).toEqual({
        success: false,
        message: "Failed to delete poll.",
      });
    });
  });

  describe("updatePollQuestion", () => {
    it("should update poll question successfully", async () => {
      const fromMock = mockSupabaseClient.from as jest.MockedFunction<
        typeof mockSupabaseClient.from
      >;

      fromMock.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(
          mockSupabaseResponse({
            data: null,
            error: null,
          }),
        ),
      } as any);

      const result = await updatePollQuestion(
        "poll-1",
        "New Question",
        "New Description",
      );

      expect(result).toEqual({
        success: true,
        message: "Poll updated successfully.",
      });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("polls");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/polls/poll-1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/polls");
    });

    it("should update poll question without description", async () => {
      const eqMock = jest.fn().mockResolvedValue({ data: [], error: null });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: updateMock,
      });

      const result = await updatePollQuestion("poll-1", "New Question");

      expect(result).toEqual({
        success: true,
        message: "Poll updated successfully.",
      });
    });

    it("should handle update error", async () => {
      const eqMock = jest
        .fn()
        .mockResolvedValue({ error: { message: "Update failed" } });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: updateMock,
      });

      const result = await updatePollQuestion("poll-1", "New Question");

      expect(result).toEqual({
        success: false,
        message: "Update failed",
      });
    });

    it("should handle error without message", async () => {
      const eqMock = jest
        .fn()
        .mockResolvedValue({ data: null, error: { code: "SOME_ERROR" } });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: updateMock,
      });

      const result = await updatePollQuestion("poll-1", "New Question");

      expect(result).toEqual({
        success: false,
        message: "Failed to update poll.",
      });
    });
  });
});
