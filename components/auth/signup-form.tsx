"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CreatePollSchema, createPollSchema } from "@/lib/schemas/poll"; // Ensure this import is correct

// --- Authentication Schemas ---
const AuthSchema = z.object({
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

// --- Authentication Actions ---

export async function login(formData: z.infer<typeof AuthSchema>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // For login, we only validate the shape and minimum password length.
  // Strict password rules are enforced at signup.
  const validatedFields = z
    .object({
      email: z.string().email(),
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

// --- Poll Actions ---

export async function createPoll(data: CreatePollSchema) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Fetch the current user from Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user is logged in, redirect to the login page.
  if (!user) {
    return redirect("/login");
  }

  // Validate the incoming form data using Zod schema
  const validatedFields = createPollSchema.safeParse(data);

  if (!validatedFields.success) {
    // Return validation errors to be displayed in the form
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { question, options } = validatedFields.data;
  const user_id = user.id; // Get the user ID from the authenticated session

  // Insert the poll into the 'polls' table
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert([{ question, owner_id: user_id }]) // Use owner_id linked to the user's ID
    .select() // Select the created poll to get its ID and other details
    .single(); // Expecting a single row back

  if (pollError) {
    console.error("Supabase error creating poll:", pollError);
    return { message: "Failed to create poll." };
  }

  // Prepare the options for insertion, linking them to the new poll
  const pollOptions = options.map((option, index) => ({
    label: option.text,
    poll_id: poll.id, // Link options to the newly created poll
    idx: index, // Assign an index for ordering if needed
  }));

  // Insert the poll options into the 'poll_options' table
  const { error: optionsError } = await supabase
    .from("poll_options")
    .insert(pollOptions);

  if (optionsError) {
    // TODO: Consider cleanup: If options fail to insert, you might want to delete the poll created above.
    console.error("Supabase error creating poll options:", optionsError);
    return { message: "Failed to create poll options." };
  }

  // Revalidate the cache for the '/polls' path. This ensures that when
  // the user is redirected to the dashboard, it fetches the latest data,
  // including the newly created poll.
  revalidatePath("/polls");

  // Redirect the user to the newly created poll's page
  redirect(`/polls/${poll.id}`);
}
