"use server";

import { prisma } from "@/lib/prisma";

export async function newVerification(token: string) {
  const pendingRegistration = await prisma.pendingRegistration.findUnique({
    where: {
      token,
    },
  });

  if (!pendingRegistration) {
    return { error: "Verification code not found." };
  }

  const hasExpired = new Date(pendingRegistration.expires) < new Date();

  if (hasExpired) {
    await prisma.pendingRegistration.delete({
      where: {
        id: pendingRegistration.id,
      },
    });

    return { error: "Verification code has expired." };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: pendingRegistration.email,
    },
  });

  if (existingUser) {
    await prisma.pendingRegistration.delete({
      where: {
        id: pendingRegistration.id,
      },
    });

    return { error: "This email address is already in use." };
  }

  await prisma.user.create({
    data: {
      name: pendingRegistration.name,
      email: pendingRegistration.email,
      password: pendingRegistration.password,
      emailVerified: new Date(),
    },
  });

  await prisma.pendingRegistration.delete({
    where: {
      id: pendingRegistration.id,
    },
  });

  return { success: "Account verified and created successfully." };
}
