import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const listUserController = async (
  request: Request,
  response: Response
) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
    },
  });

  response.send({
    ok: true,
    users,
  });
};

export const listUniqueUserController = async (
  request: Request,
  response: Response
): Promise<void> => {
  const { userId } = request.params;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    response.status(404).send({ error: "user not found" });
    return;
  }

  response.send(user);
};
