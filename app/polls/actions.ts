"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPollSchema, CreatePollSchema } from "@/lib/schemas/poll";
import { cookies } from "next/headers"; // Import cookies here as well

export async function createPoll(data: CreatePollSchema) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If no user is found, redirect to the login page.
    // This provides a better UX than returning an error for a missing user.
    return redirect("/login");
  }

  const validatedFields = createPollSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { question, options } = validatedFields.data;

  // Insert the poll into the 'polls' table
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert([{ question, owner_id: user.id }]) // Use owner_id from user session
    .select() // Select the created poll to get its ID
    .single(); // Expecting a single row back

  if (pollError) {
    console.error("Supabase error creating poll:", pollError);
    return {
      message: "Failed to create poll.",
    };
  }

  // Prepare the options to be inserted
  const pollOptions = options.map((option) => ({
    label: option.text,
    poll_id: poll.id, // Link options to the newly created poll
    // idx: // You might want to add an index 'idx' here if order matters and you're not relying on DB defaults or ordering by label.
  }));

  // Insert the poll options
  const { error: optionsError } = await supabase
    .from("poll_options")
    .insert(pollOptions);

  if (optionsError) {
    console.error("Supabase error creating poll options:", optionsError);
    // TODO: Consider cleanup: If options fail, you might want to delete the poll created above.
    return {
      message: "Failed to create poll options.",
    };
  }

  // Revalidate the polls path cache to show the new poll on the dashboard
  revalidatePath("/polls");
  // Redirect to the newly created poll's page
  redirect(`/polls/${poll.id}`);
}
