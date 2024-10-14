import express from "express";
import {
  createUserController,
  listUniqueUserController,
  listUserController,
} from "./controllers/user.controller";
import { createTodoController } from "./controllers/todo.controller";
import { createCheckoutController } from "./controllers/checkout.controller";
import { stripeWebhookController } from "./controllers/stripe.controller";

const app = express();

app.use(express.json());

const port = 3000;

app.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

app.get("/users", listUserController);
app.get("/users/:userId", listUniqueUserController);
app.post("/users", createUserController);

app.post("/todos", createTodoController);

app.post("/checkout", createCheckoutController);

app.listen(port, () => {
  console.log(`Server is now running on http://localhost:${port}`);
});
