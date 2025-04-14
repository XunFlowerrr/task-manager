import express, { Express } from "express";
import { config } from "./config/config.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { logger } from "./logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const log = logger("index.ts");
const app: Express = express();
const port = config.port || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(helmet());
app.use(cors());

import authRouter from "./routes/auth.js";
import projectRouter from "./routes/project.js";
import tasksRouter from "./routes/tasks.js";
import projectMembersRouter from "./routes/projectMembers.js";
import projectInvitationsRouter from "./routes/projectInvitations.js";
import attachmentRouter from "./routes/attachment.js";
import userRouter from "./routes/user.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/project-members", projectMembersRouter);
app.use("/api/v1/project-invitations", projectInvitationsRouter);
app.use("/api/v1/attachments", attachmentRouter);
app.use("/api/v1/users", userRouter);

app.listen(port, () => {
  log.info(`Server is running on http://localhost:${port}`);
});
