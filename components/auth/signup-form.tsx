"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signup } from "@/app/(auth)/actions";
import { useTransition, useState } from "react";
import Link from "next/link";

const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupSchemaType = z.infer<typeof SignupSchema>;

export default function SignupForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(SignupSchema),
  });

  const onSubmit = (data: SignupSchemaType) => {
    setResult(null);
    startTransition(async () => {
      const result = await signup(data);
      if (result?.error) {
        setResult({ success: false, message: result.error });
      } else {
        setResult({
          success: true,
          message: "A confirmation link has been sent to your email!",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result?.success && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </>
          )}

          {result && (
            <div
              className={`rounded-md border p-3 text-sm ${
                result.success
                  ? "border-green-500 bg-green-50 text-green-800"
                  : "border-red-500 bg-red-50 text-red-700"
              }`}
            >
              {result.message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          {!result?.success && (
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating account..." : "Sign Up"}
            </Button>
          )}
          <p className="text-center text-sm text-muted-foreground">
            {"Already have an account?"}{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </form>
  );
}
