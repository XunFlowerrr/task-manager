import express from "express";
import { createRouteHandler } from "uploadthing/express";
import { authMiddleware } from "../middleware/auth.js";
import { uploadRouter } from "../config/uploadthing.js";
import { getAllAttachments, downloadAttachment, deleteAttachment, saveAttachmentMetadata } from "../controllers/attachment.js";
import { logger } from "../logger.js";
const log = logger("attachment.routes.ts");
const router = express.Router();
// Apply auth middleware to all attachment routes
router.use(authMiddleware);
// Set up UploadThing routes
const uploadthingExpressRouter = createRouteHandler({
    router: uploadRouter,
});
// Mount UploadThing routes
router.use("/uploadthing", uploadthingExpressRouter);
// Add route for saving attachment metadata after successful upload
router.post("/metadata", saveAttachmentMetadata);
// Regular routes for attachment management
router.get("/", getAllAttachments); // Get attachments (all user's or for specific task via query param ?taskId=...)
router.get("/:id/download", downloadAttachment); // Download a specific attachment
router.delete("/:id", deleteAttachment); // Delete a specific attachment
// Log all routes
if (process.env.NODE_ENV === "development") {
    log.info("Attachment routes:");
    // @ts-ignore - Express router._router is not in the type definitions
    router._router?.stack?.forEach((r) => {
        if (r.route && r.route.path) {
            log.info(`${Object.keys(r.route.methods)} ${r.route.path}`);
        }
    });
}
export default router;
//# sourceMappingURL=attachment.js.map