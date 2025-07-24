import InvalidResetLink from "@/components/reset-password/InvalidResetLink";
import PasswordResetForm from "@/components/reset-password/PasswordResetForm";

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ token: string; email: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token) {
    return <InvalidResetLink />;
  }

  return <PasswordResetForm token={token} email={email} />;
}
