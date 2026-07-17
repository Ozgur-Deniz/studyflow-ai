import { prisma } from "@/lib/prisma";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generateVerificationToken(email: string) {
  const token = generateCode();
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: {
      email,
    },
  });

  const verificationToken = await prisma.verificationToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return verificationToken;
}

export async function generatePendingRegistration({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const token = generateCode();
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.pendingRegistration.deleteMany({
    where: {
      email,
    },
  });

  const pendingRegistration = await prisma.pendingRegistration.create({
    data: {
      name,
      email,
      password,
      token,
      expires,
    },
  });

  return pendingRegistration;
}

export async function generatePasswordResetToken(email: string) {
  const token = generateCode();
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({
    where: {
      email,
    },
  });

  const passwordResetToken = await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return passwordResetToken;
}
