// filepath: d:\Work\GitHub\task-management\frontend\app\api\uploadthing\core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

const f = createUploadthing();

// Helper function to extract userId from token if needed
const extractUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;
    return decoded.userId || null;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  taskAttachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "16MB", maxFileCount: 1 },
    audio: { maxFileSize: "8MB", maxFileCount: 2 },
    pdf: { maxFileSize: "8MB", maxFileCount: 5 },
    text: { maxFileSize: "2MB", maxFileCount: 5 },
    blob: { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const session = await getServerSession(authOptions);

      // If you throw, the user will not be able to upload
      if (!session || !session.user) {
        throw new Error("Unauthorized");
      }

      console.log("Session user data:", session.user);

      // Try to get userId from various sources
      let userId = session.user.userId;

      // If userId is not directly available, try to extract from token or use id
      if (!userId && session.user.token) {
        userId = extractUserIdFromToken(session.user.token);
      }

      // Fallback to id if available
      if (!userId && session.user.id) {
        userId = session.user.id;
      }

      // Final fallback
      if (!userId) {
        userId = "anonymous";
        console.warn("Could not determine userId for upload");
      }

      // Whatever is returned here is accessible in onUploadComplete as metadata
      return {
        userId
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Return data to the client
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
