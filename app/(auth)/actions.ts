"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CreatePollSchema, createPollSchema } from "@/lib/schemas/poll";

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
