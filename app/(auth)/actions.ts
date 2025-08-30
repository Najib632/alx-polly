"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Define a single schema for both login and signup
const AuthSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function login(formData: z.infer<typeof AuthSchema>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const validatedFields = AuthSchema.safeParse(formData);

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
    return {
      error: "Could not authenticate user. Please check your credentials.",
    };
  }

  return redirect("/polls");
}

export async function signup(formData: z.infer<typeof AuthSchema>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const validatedFields = AuthSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields provided.",
    };
  }

  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Supabase signup error:", error);
    if (error.message.includes("User already registered")) {
      return {
        error: "A user with this email already exists.",
      };
    }
    return {
      error: "Could not create user. Please try again later.",
    };
  }

  // Supabase sends a confirmation email automatically.
  return {
    error: null,
  };
}
