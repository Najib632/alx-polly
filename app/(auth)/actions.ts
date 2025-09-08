"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CreatePollSchema, createPollSchema } from "@/lib/schemas/poll";

/**
 * @file This file defines server-side actions for the polling application.
 *
 * @description
 * This module centralizes the application's backend logic, leveraging Next.js Server Actions
 * to interact with the Supabase backend. It's divided into two main sections:
 * 1.  Authentication Actions: Handles user sign-up, login, and logout.
 * 2.  Poll Actions: Manages the creation and manipulation of polls.
 *
 * Using server actions here provides a secure and streamlined way to handle form submissions
 * and data mutations directly from React components without needing to write separate API endpoints.
 *
 * @assumptions
 * - Supabase environment variables (URL, ANON_KEY) are correctly configured.
 * - The Supabase database has the required tables (`polls`, `poll_options`) and policies
 *   set up to allow these operations.
 * - These actions are called from within the Next.js Server Component or Server Action context,
 *   which provides access to functions like `cookies()`, `redirect()`, and `revalidatePath()`.
 *
 * @connections
 * - **UI Components:** These actions are designed to be invoked by form components (e.g.,
 *   `LoginForm.tsx`, `SignupForm.tsx`, `CreatePollForm.tsx`). The return values (errors or redirects)
 *   are handled by the calling component to provide user feedback.
 * - **Zod Schemas (`@/lib/schemas`):** Input data is rigorously validated against Zod schemas
 *   (`AuthSchema`, `CreatePollSchema`) to ensure data integrity before processing.
 * - **Supabase Client (`@/lib/supabase/server`):** All database and authentication operations
 *   are performed using the server-side Supabase client, which securely handles user sessions
 *   via cookies.
 * - **Next.js App Router:** The `redirect()` and `revalidatePath()` functions from Next.js are
 *   used to manage navigation and cache invalidation, ensuring the UI stays in sync with
 *   the backend state after a successful action.
 *
 * @edge_cases
 * - **Authentication Failures:** The login/signup functions handle common issues like invalid
 *   credentials or existing users and return specific error messages to the client.
 * - **Database Transactionality:** The `createPoll` action involves two separate database inserts
 *   (for the poll and its options). If the second insert fails, the poll will exist without
 *   options. In a more complex application, this would ideally be wrapped in a database transaction
 *   to ensure atomicity.
 * - **Authorization:** Actions like `createPoll` explicitly check for an authenticated user session
 *   and redirect unauthenticated users to the login page.
 */
const AuthSchema = z.object({
  /**
   * Defines the validation schema for user authentication credentials.
   *
   * @description
   * This Zod schema is a critical component for ensuring data integrity and security
   * during the user signup process. It enforces a valid email format and a strong
   * password policy. By centralizing these validation rules, we ensure consistency
   * and provide a single source of truth for what constitutes valid user credentials.
   * This schema is primarily used in the `signup` server action to validate user
   * input before attempting to create a new user in Supabase.
   *
   * @assumptions
   * - This schema represents the strictest set of rules, intended for new user registration.
   * - The error messages are user-facing and should be clear and helpful.
   *
   * @connections
   * - **`signup` Server Action:** This schema is the primary validator for the `signup` action.
   *   If validation fails, the action returns specific error messages derived from this
   *   schema to the client.
   * - **`login` Server Action:** The `login` action uses a more lenient, inline-defined schema
   *   because the strict password rules only need to be enforced at creation time, not every
   *   time a user logs in.
   * - **UI Forms (e.g., `SignupForm.tsx`):** The validation logic here directly impacts the
   *   user experience. Error messages from this schema are displayed to the user to guide
   *   them in correcting their input.
   *
   * @edge_cases
   * - **Invalid Input:** If any of the rules are violated (e.g., password too short, email
   *   malformed), the `safeParse` method used in the server actions will fail, preventing
   *   the action from proceeding and allowing for a specific error to be returned to the UI.
   */
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character",
    ),
});

export async function login(formData: z.infer<typeof AuthSchema>) {
  /**
   * Handles the user login process.
   *
   * @description
   * This server action is the primary mechanism for authenticating an existing user. It takes
   * email and password credentials, validates them, and attempts to sign the user in using
   * Supabase Auth. It's a critical part of the application's security, ensuring that only
   * registered users can access protected routes like the polls dashboard.
   *
   * Unlike the signup action, the validation here is less strict on the password format,
   * only checking for its presence, as the password's complexity was already enforced
   * during account creation.
   *
   * @param {z.infer<typeof AuthSchema>} formData - The user's login credentials (email and password).
   *
   * @returns {Promise<{ error: string } | void>} - On failure, returns an object with a user-friendly
   *   `error` message. On success, it triggers a redirect to the '/polls' dashboard and
   *   does not return a value.
   *
   * @assumptions
   * - This action is called from a client-side form (e.g., `LoginForm.tsx`).
   * - The user attempting to log in has already successfully completed the signup process.
   * - Supabase is properly configured and reachable.
   *
   * @connections
   * - **UI:** Invoked by the form submission in `LoginForm.tsx`.
   * - **Validation:** Uses a less-strict Zod schema to validate the presence and format of inputs.
   * - **Supabase:** Interacts with `supabase.auth.signInWithPassword` to perform the authentication.
   * - **Next.js:** Uses `cookies()` to create the Supabase client and `redirect()` to navigate the
   *   user to the `/polls` page after a successful login.
   *
   * @edge_cases
   * - **Invalid Input:** If the email is not in a valid format or the password is empty, the
   *   function returns an "Invalid fields" error.
   * - **Authentication Failure:** If Supabase returns an error (e.g., incorrect password,
   *   user not found), a generic "Could not authenticate user" message is returned to avoid
   *   leaking information about which field was incorrect.
   * - **Network/Supabase Errors:** Any other unexpected errors during the Supabase call will also
   *   result in the generic authentication error message.
   */
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // For login, we only validate the shape and minimum password length.
  // Strict password rules are enforced at signup.
  const validatedFields = z
    .object({
      email: z.email(),
      password: z.string().min(1), // Basic check for password presence during login
    })
    .safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields provided.",
    };
  }

  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Provide user-friendly error message
    return {
      error: "Could not authenticate user. Please check your credentials.",
    };
  }

  // Redirect to the polls dashboard upon successful login
  return redirect("/polls");
}

export async function signup(formData: z.infer<typeof AuthSchema>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Use the strict AuthSchema for signup validation
  const validatedFields = AuthSchema.safeParse(formData);

  if (!validatedFields.success) {
    // Return the first specific Zod error message for better UX
    const firstError = validatedFields.error.issues[0].message;
    return {
      error: firstError || "Invalid fields provided.",
    };
  }

  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Supabase signup error:", error); // Log the detailed error for debugging
    if (error.message.includes("User already registered")) {
      return {
        error: "A user with this email already exists.",
      };
    }
    return {
      error: "Could not create user. Please try again later.",
    };
  }

  // Supabase automatically sends a confirmation email.
  // Return success indication.
  return {
    error: null,
  };
}

export async function logout() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase logout error:", error);
    // You might want to return an error message here, or just redirect anyway.
    // For logout, redirecting is often the priority.
  }

  // Redirect to the login page after logging out
  return redirect("/login");
}

// --- Poll Actions ---

export async function createPoll(data: CreatePollSchema) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const validatedFields = createPollSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { question, options } = validatedFields.data;
  const user_id = user.id;

  // Insert the poll into the 'polls' table, passing both question and title
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert([
      {
        question,
        title: question, // Using question as the title
        owner_id: user_id,
      },
    ])
    .select()
    .single();

  if (pollError) {
    console.error("Supabase error creating poll:", pollError);
    return { message: "Failed to create poll." };
  }

  // Prepare the options for insertion
  const pollOptions = options.map((option, index) => ({
    label: option.text,
    poll_id: poll.id,
    idx: index,
  }));

  // Insert the poll options
  const { error: optionsError } = await supabase
    .from("poll_options")
    .insert(pollOptions);

  if (optionsError) {
    console.error("Supabase error creating poll options:", optionsError);
    return { message: "Failed to create poll options." };
  }

  revalidatePath("/polls");
  redirect(`/polls/${poll.id}`);
}
