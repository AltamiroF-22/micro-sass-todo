import express from "express";
import {
  createUserController,
  listUniqueUserController,
  listUserController,
} from "./controllers/user.controller";

const app = express();

app.use(express.json());

const port = 3000;

const newUser = {
  name: "junior",
  email: "altamiroribeirodarocha@gmail.com",
};

app.get("/users", listUserController);
app.get("/users/:userId", listUniqueUserController);

app.post("/users", createUserController);

app.listen(port, () => {
  console.log(`Server is now running on http://localhost:${port}`);
});
