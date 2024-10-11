import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createTodoController = async (
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

  const { title } = request.body;

  if (!title) {
    response.status(400).send({ error: "Title is required" });
    return;
  }

  const todo = await prisma.todo.create({
    data: {
      title,
      userId: user.id,
    },
  });

  response.status(201).send(todo);
};
