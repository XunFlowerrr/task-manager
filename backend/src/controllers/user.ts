import { Request, Response } from "express";
import { query } from "../config/database.js";
import { logger } from "../logger.js";
import { User } from "../interfaces/index.js";

const log = logger("user.ts");

/**
 * Search for users by username or email, excluding existing project members and self.
 */
export async function searchUsers(req: Request, res: Response): Promise<void> {
  const { q, projectId } = req.query;
  const requestingUserId = req.user!.userId; // From authMiddleware

  log.info(
    `searchUsers: Request received, query='${q}', projectId='${projectId}', requestingUser='${requestingUserId}'`
  );

  if (!q || typeof q !== "string" || q.trim().length < 1) {
    // Return empty array if query is too short or invalid, avoids unnecessary DB query
    res.status(200).json([]);
    return;
  }
  if (!projectId) {
    res.status(400).json({ error: "Missing required query parameter: projectId" });
    return;
  }

  const searchTerm = `%${(q as string).trim().toLowerCase()}%`;

  try {
    // Verify the requesting user is part of the project they are searching for members for
    const accessCheckRes = await query(
      `SELECT 1 FROM project_member
       WHERE project_id = $1 AND user_id = $2
       UNION
       SELECT 1 FROM project
       WHERE project_id = $1 AND owner_id = $2`,
      [projectId, requestingUserId]
    );

    if (accessCheckRes.rowCount === 0) {
      log.warn(
        `searchUsers: User ${requestingUserId} not authorized for project ${projectId}`
      );
      res.status(403).json({ error: "Not authorized to search users for this project" });
      return;
    }

    // Find users matching the search term (username or email)
    // Exclude users already in the project and the user making the request
    const result = await query(
      `SELECT user_id, username, email
       FROM users
       WHERE (LOWER(username) LIKE $1 OR LOWER(email) LIKE $1)
         AND user_id != $2 -- Exclude self
         AND user_id NOT IN ( -- Exclude existing members/owner
           SELECT user_id FROM project_member WHERE project_id = $3
         )
       LIMIT 10`, // Limit results for performance
      [searchTerm, requestingUserId, projectId]
    );

    log.info(
      `searchUsers: Found ${result.rowCount} users matching query '${q}' for project '${projectId}'`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    log.error("searchUsers error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Add other user-related controllers if needed (e.g., getUserById)
