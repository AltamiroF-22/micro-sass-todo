import express from "express";
import { listUniqueUserController, listUserController } from "./controllers/user.controller";

const app = express();
const port = 3000;

app.get("/users", listUserController);
app.get("/users/:userId", listUniqueUserController);

app.listen(port, () => {
  console.log(`Server is now running on http://localhost:${port}`);
});
