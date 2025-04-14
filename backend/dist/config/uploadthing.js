import { createUploadthing } from "uploadthing/express";
import { logger } from "../logger.js";
const log = logger("uploadthing.ts");
// Create an UploadThing instance
const f = createUploadthing();
// Define our file routes
export const uploadRouter = {
    // Define routes with different file type configurations
    taskAttachment: f({
        // Accept all file types (customize as needed)
        image: { maxFileSize: "4MB", maxFileCount: 5 },
        video: { maxFileSize: "16MB", maxFileCount: 1 },
        audio: { maxFileSize: "8MB", maxFileCount: 2 },
        pdf: { maxFileSize: "8MB", maxFileCount: 5 },
        text: { maxFileSize: "2MB", maxFileCount: 5 },
        // For any other file types
        blob: { maxFileSize: "8MB", maxFileCount: 5 },
    })
        .middleware(({ req }) => {
        // This code runs on your server before upload
        const user = req.user;
        // If user isn't authenticated, deny the upload
        if (!user) {
            throw new Error("Unauthorized");
        }
        // Return user info to be used in onUploadComplete
        return { userId: user.userId };
    })
        .onUploadComplete(async ({ metadata, file }) => {
        // This code runs on your server after upload
        log.info(`Upload complete for user ${metadata.userId}: file ${file.name} with URL ${file.url}`);
        // Return the file information
        return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
};
//# sourceMappingURL=uploadthing.js.map