import Link from "next/link";
import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

function PasswordChangeSuccess() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center">
      <Card className="w-[95vw] sm:max-w-[350px]">
        <CardHeader className="space-y-4">
          <CardTitle className="text-2xl">Password Reset Success</CardTitle>
          <CardDescription>
            Your password has been successfully updated. You will be redirected
            to the login page shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PasswordChangeSuccess;
