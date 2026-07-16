"use server";

import { prisma } from "@/lib/prisma";

export async function newVerification(token: string) {
  const existingToken = await prisma.verificationToken.findUnique({
    where: {
      token,
    },
  });

  if (!existingToken) {
    return { error: "Verification code not found." };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Verification code has expired." };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: existingToken.email,
    },
  });

  if (!existingUser) {
    return { error: "User not found." };
  }

  await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      emailVerified: new Date(),
    },
  });

  await prisma.verificationToken.delete({
    where: {
      id: existingToken.id,
    },
  });

  return { success: "Email verified successfully." };
}
