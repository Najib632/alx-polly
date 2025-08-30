import { z } from "zod";

export const createPollSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question is required")
    .max(280, "Question must be less than 280 characters"),
  options: z
    .array(
      z.object({
        text: z
          .string()
          .trim()
          .min(1, "Option text is required")
          .max(140, "Option text must be less than 140 characters"),
      }),
    )
    .min(2, "You must provide at least two options")
    .max(20, "You can provide a maximum of 20 options"),
});

export type CreatePollSchema = z.infer<typeof createPollSchema>;
