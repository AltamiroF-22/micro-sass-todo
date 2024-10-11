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
export const createUserController = async (
  request: Request,
  response: Response
) => {
  const { name, email } = request.body;

  if (!name || !email) {
    response.status(400).send({
      error: "Email or name are missing!",
    });
    return;
  }

  const emailAlreadyExists = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (emailAlreadyExists) {
    response.status(400).send({ error: "email already in use" });
    return;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
    },
  });

  response.send(user);
};
