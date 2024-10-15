import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { createCheckoutSession } from "../stripe";

export const createCheckoutController = async (
  request: Request,
  response: Response
): Promise<void> => {
  const userId = request.headers["x-user-id"];

  if (!userId) {
    response.status(403).send({ error: "Not authorized: User ID missing" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user) {
    response.status(403).send({ error: "Not authorized: User not found" });
    return;
  }

  const checkout = await createCheckoutSession(user.id, user.email);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      stripeCustomerId: checkout?.stripeCustomerId,
    },
  });

  response.send(checkout);
};
