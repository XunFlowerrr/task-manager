import { query } from "../config/database.js";
import { logger } from "../logger.js";
const log = logger("tasks.js");

export async function createTask(req, res) {
  log.info("createTask: Request received, body=" + JSON.stringify(req.body));
  try {
    const {
      projectId,
      taskName,
      taskDescription,
      startDate,
      dueDate,
      status,
      priority,
      assignees,
    } = req.body;
    if (!projectId || !taskName) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const sanitizedProjectId = projectId.trim();
    const sanitizedTaskName = taskName.trim();
    const sanitizedTaskDescription = taskDescription
      ? taskDescription.trim()
      : "";
    const sanitizedStatus = status ? status.trim() : "pending";
    const membershipCheck = await query(
      `SELECT p.project_id
       FROM project p
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE p.project_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [sanitizedProjectId, req.user.userId]
    );
    if (membershipCheck.rowCount === 0)
      return res.status(403).json({ error: "Not authorized" });

    const newId = await query("SELECT generate_task_id() as id");
    const taskId = newId.rows[0].id;
    await query(
      `INSERT INTO task (task_id, project_id, task_name, task_description, start_date, due_date, status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        taskId,
        sanitizedProjectId,
        sanitizedTaskName,
        sanitizedTaskDescription,
        startDate,
        dueDate,
        sanitizedStatus,
        priority,
      ]
    );

    // Add assignees if provided
    if (assignees && Array.isArray(assignees) && assignees.length > 0) {
      // Validate that all assignees are members of the project
      for (const assigneeId of assignees) {
        const isMember = await query(
          `SELECT user_id FROM project_member
           WHERE project_id = $1 AND user_id = $2
           UNION
           SELECT owner_id FROM project
           WHERE project_id = $1 AND owner_id = $2`,
          [sanitizedProjectId, assigneeId]
        );

        if (isMember.rowCount > 0) {
          await query(
            "INSERT INTO task_assignee (task_id, user_id) VALUES ($1, $2)",
            [taskId, assigneeId]
          );
          log.debug(
            `createTask: User ${assigneeId} assigned to task ${taskId}`
          );
        } else {
          log.warn(
            `createTask: Attempted to assign non-member ${assigneeId} to task ${taskId}`
          );
        }
      }
    }

    log.info(
      `createTask: Task ${taskId} created in project ${sanitizedProjectId}`
    );
    res.status(201).json({ message: "Task created", taskId });
  } catch (error) {
    log.error("createTask error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAllTasks(req, res) {
  log.info("getAllTasks: Request received, query=" + JSON.stringify(req.query));
  try {
    const { projectId } = req.query;
    const membershipCheck = await query(
      `SELECT p.project_id
       FROM project p
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE p.project_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [projectId, req.user.userId]
    );
    if (membershipCheck.rowCount === 0)
      return res.status(403).json({ error: "Not authorized" });

    // Get tasks with their assignees
    const result = await query(
      `SELECT t.*,
        (SELECT json_agg(json_build_object('user_id', ta.user_id))
         FROM task_assignee ta
         WHERE ta.task_id = t.task_id) as assignees
       FROM task t WHERE t.project_id = $1`,
      [projectId]
    );
    log.info(
      `getAllTasks: Retrieved ${result.rowCount} tasks for project ${projectId}`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    log.error("getAllTasks error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTask(req, res) {
  log.info("getTask: Request received, params=" + JSON.stringify(req.params));
  try {
    const { id } = req.params;

    // Get task with assignee details
    const result = await query(
      `SELECT t.*,
        (SELECT json_agg(json_build_object('user_id', ta.user_id))
         FROM task_assignee ta
         WHERE ta.task_id = t.task_id) as assignees
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [id, req.user.userId]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Not found or not authorized" });
    log.info(`getTask: Retrieved task ${id}`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    log.error("getTask error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateTask(req, res) {
  log.info(
    "updateTask: Request received, params=" +
      JSON.stringify(req.params) +
      ", body=" +
      JSON.stringify(req.body)
  );
  try {
    const { id } = req.params;
    const {
      taskName,
      taskDescription,
      startDate,
      dueDate,
      status,
      priority,
      assignees,
    } = req.body;
    if (!taskName) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const sanitizedTaskName = taskName.trim();
    const sanitizedTaskDescription = taskDescription
      ? taskDescription.trim()
      : "";
    const sanitizedStatus = status ? status.trim() : "pending";

    // Get task and project info to verify membership and project ID
    const membershipCheck = await query(
      `SELECT t.*, p.project_id
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [id, req.user.userId]
    );
    if (membershipCheck.rowCount === 0)
      return res.status(403).json({ error: "Not authorized" });

    const projectId = membershipCheck.rows[0].project_id;

    // Update task details
    await query(
      `UPDATE task SET task_name=$1, task_description=$2, start_date=$3, due_date=$4, status=$5, priority=$6
       WHERE task_id=$7`,
      [
        sanitizedTaskName,
        sanitizedTaskDescription,
        startDate,
        dueDate,
        sanitizedStatus,
        priority,
        id,
      ]
    );

    // Update assignees if provided
    if (assignees && Array.isArray(assignees)) {
      // Clear existing assignments
      await query("DELETE FROM task_assignee WHERE task_id = $1", [id]);

      // Add new assignments
      if (assignees.length > 0) {
        for (const assigneeId of assignees) {
          const isMember = await query(
            `SELECT user_id FROM project_member
             WHERE project_id = $1 AND user_id = $2
             UNION
             SELECT owner_id FROM project
             WHERE project_id = $1 AND owner_id = $2`,
            [projectId, assigneeId]
          );

          if (isMember.rowCount > 0) {
            await query(
              "INSERT INTO task_assignee (task_id, user_id) VALUES ($1, $2)",
              [id, assigneeId]
            );
            log.debug(`updateTask: User ${assigneeId} assigned to task ${id}`);
          } else {
            log.warn(
              `updateTask: Attempted to assign non-member ${assigneeId} to task ${id}`
            );
          }
        }
      }
    }

    log.info(`updateTask: Task ${id} updated`);
    res.status(200).json({ message: "Task updated" });
  } catch (error) {
    log.error("updateTask error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteTask(req, res) {
  log.info(
    "deleteTask: Request received, params=" + JSON.stringify(req.params)
  );
  try {
    const { id } = req.params;
    const membershipCheck = await query(
      `SELECT t.*
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [id, req.user.userId]
    );
    if (membershipCheck.rowCount === 0)
      return res.status(403).json({ error: "Not authorized" });

    // Note: Deletion from task_assignee table will be handled by CASCADE constraint
    await query("DELETE FROM task WHERE task_id = $1", [id]);
    log.info(`deleteTask: Task ${id} deleted`);
    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    log.error("deleteTask error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// New functions for managing task assignees
export async function assignUser(req, res) {
  log.info(
    "assignUser: Request received, params=" +
      JSON.stringify(req.params) +
      ", body=" +
      JSON.stringify(req.body)
  );
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required field: userId." });
    }

    // Check if user has permission to modify the task (is member of the project)
    const taskCheck = await query(
      `SELECT t.task_id, p.project_id
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [taskId, req.user.userId]
    );

    if (taskCheck.rowCount === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this task" });
    }

    const projectId = taskCheck.rows[0].project_id;

    // Check if the assignee is a member of the project
    const memberCheck = await query(
      `SELECT user_id FROM project_member
       WHERE project_id = $1 AND user_id = $2
       UNION
       SELECT owner_id FROM project
       WHERE project_id = $1 AND owner_id = $2`,
      [projectId, userId]
    );

    if (memberCheck.rowCount === 0) {
      return res
        .status(400)
        .json({ error: "User is not a member of the project" });
    }

    // Check if the assignment already exists
    const assignmentCheck = await query(
      "SELECT * FROM task_assignee WHERE task_id = $1 AND user_id = $2",
      [taskId, userId]
    );

    if (assignmentCheck.rowCount > 0) {
      return res
        .status(400)
        .json({ error: "User is already assigned to this task" });
    }

    // Add assignment
    await query(
      "INSERT INTO task_assignee (task_id, user_id) VALUES ($1, $2)",
      [taskId, userId]
    );

    log.info(`assignUser: User ${userId} assigned to task ${taskId}`);
    res.status(201).json({ message: "User assigned to task" });
  } catch (error) {
    log.error("assignUser error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function unassignUser(req, res) {
  log.info(
    "unassignUser: Request received, params=" + JSON.stringify(req.params)
  );
  try {
    const { taskId, userId } = req.params;

    // Check if user has permission to modify the task
    const taskCheck = await query(
      `SELECT t.task_id
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [taskId, req.user.userId]
    );

    if (taskCheck.rowCount === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this task" });
    }

    // Remove assignment
    await query(
      "DELETE FROM task_assignee WHERE task_id = $1 AND user_id = $2",
      [taskId, userId]
    );

    log.info(`unassignUser: User ${userId} unassigned from task ${taskId}`);
    res.status(200).json({ message: "User unassigned from task" });
  } catch (error) {
    log.error("unassignUser error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTaskAssignees(req, res) {
  log.info(
    "getTaskAssignees: Request received, params=" + JSON.stringify(req.params)
  );
  try {
    const { taskId } = req.params;

    // Check if user has permission to view the task
    const taskCheck = await query(
      `SELECT t.task_id
       FROM task t
       JOIN project p ON t.project_id = p.project_id
       LEFT JOIN project_member pm ON p.project_id = pm.project_id
       WHERE t.task_id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [taskId, req.user.userId]
    );

    if (taskCheck.rowCount === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this task" });
    }

    // Get assignees with user details
    const assignees = await query(
      `SELECT ta.user_id, u.username, u.email
       FROM task_assignee ta
       JOIN users u ON ta.user_id = u.user_id
       WHERE ta.task_id = $1`,
      [taskId]
    );

    log.info(
      `getTaskAssignees: Retrieved ${assignees.rowCount} assignees for task ${taskId}`
    );
    res.status(200).json(assignees.rows);
  } catch (error) {
    log.error("getTaskAssignees error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUserTasks(req, res) {
  log.info("getUserTasks: Request received");
  try {
    const userId = req.user.userId;

    // Get tasks with more details and assignee information
    const tasks = await query(
      `SELECT t.*, p.project_name,
        (SELECT json_agg(json_build_object('user_id', u.user_id, 'username', u.username, 'email', u.email))
         FROM task_assignee ta
         JOIN users u ON ta.user_id = u.user_id
         WHERE ta.task_id = t.task_id) as assignees
       FROM task t
       JOIN task_assignee ta ON t.task_id = ta.task_id
       JOIN project p ON t.project_id = p.project_id
       WHERE ta.user_id = $1
       ORDER BY t.due_date ASC NULLS LAST, t.priority DESC`,
      [userId]
    );

    log.info(
      `getUserTasks: Retrieved ${tasks.rowCount} tasks for user ${userId}`
    );
    res.status(200).json(tasks.rows);
  } catch (error) {
    log.error("getUserTasks error: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
}
