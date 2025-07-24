import Link from "next/link";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";

function InvalidResetLink() {
  return (
    <div className="min-h-screen grid place-items-center">
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <CardTitle className="text-center text-lg">
            Invalid Reset Link
          </CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a new reset link</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default InvalidResetLink;
