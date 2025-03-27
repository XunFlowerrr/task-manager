CREATE TABLE users(
    user_id CHAR(5) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    CONSTRAINT uk_user_email UNIQUE (email)
);

CREATE TABLE project (
  project_id CHAR(5) PRIMARY KEY NOT NULL,
  project_name VARCHAR(100) NOT NULL,
  project_description TEXT,
  owner_id CHAR(5) NOT NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INT DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE task(
  task_id CHAR(5) PRIMARY KEY NOT NULL,
  project_id CHAR(5) NOT NULL,
  task_name VARCHAR(100),
  task_description VARCHAR(280),
  start_date TIMESTAMP,
  due_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  priority INT DEFAULT 0,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE attachment(
  attachment_id CHAR(5) PRIMARY KEY,
  attachment_name VARCHAR(100) NOT NULL,
  task_id CHAR(5) NOT NULL,
  file_url VARCHAR(1000),
  file_type VARCHAR(20) NOT NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES task(task_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE project_member(
  project_id CHAR(5) NOT NULL,
  user_id CHAR(5) NOT NULL,
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE task_assignee(
  task_id CHAR(5) NOT NULL,
  user_id CHAR(5) NOT NULL,
  PRIMARY KEY (task_id, user_id),
  CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES task(task_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Added PostgreSQL functions to keep the same functionality as MySQL stored procedures

CREATE OR REPLACE FUNCTION generate_user_id() RETURNS CHAR(5) AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(user_id::int), 0) INTO max_id FROM users;
    RETURN LPAD((max_id + 1)::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_project_id() RETURNS CHAR(5) AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(project_id::int), 0) INTO max_id FROM project;
    RETURN LPAD((max_id + 1)::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_task_id() RETURNS CHAR(5) AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(task_id::int), 0) INTO max_id FROM task;
    RETURN LPAD((max_id + 1)::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_attachment_id() RETURNS CHAR(5) AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(attachment_id::int), 0) INTO max_id FROM attachment;
    RETURN LPAD((max_id + 1)::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Add pending invitation functionality
CREATE TABLE project_invitation(
  invitation_id CHAR(5) PRIMARY KEY,
  project_id CHAR(5) NOT NULL,
  user_id CHAR(5) NOT NULL,         -- invited user
  invited_by CHAR(5) NOT NULL,       -- project owner who invited
  status VARCHAR(20) DEFAULT 'pending',
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inviter FOREIGN KEY (invited_by) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE OR REPLACE FUNCTION generate_invitation_id() RETURNS CHAR(5) AS $$
DECLARE
    max_id INT;
BEGIN
    SELECT COALESCE(MAX(invitation_id::int), 0) INTO max_id FROM project_invitation;
    RETURN LPAD((max_id + 1)::text, 5, '0');
END;
$$ LANGUAGE plpgsql;




