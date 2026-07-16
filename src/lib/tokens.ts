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
