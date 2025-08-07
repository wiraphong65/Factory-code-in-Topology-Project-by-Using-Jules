# Requirements Document

## Introduction

ปรับปรุงระบบประวัติการวิเคราะห์ AI ให้เป็นแบบ Project-based แทนที่จะเป็น User-based เพื่อให้ผู้ใช้เห็นประวัติที่เกี่ยวข้องกับโปรเจกต์ที่กำลังทำงานเท่านั้น ทำให้การจัดการและการใช้งานมีประสิทธิภาพมากขึ้น

## Requirements

### Requirement 1

**User Story:** As a user working on a specific project, I want to see only the analysis history related to the current project, so that I can focus on relevant analysis results without being distracted by other projects' data.

#### Acceptance Criteria

1. WHEN I open the AI Panel history tab THEN the system SHALL display only analysis history from the current active project
2. WHEN there is no active project selected THEN the system SHALL show an empty state with appropriate message
3. WHEN I switch to a different project THEN the system SHALL automatically update the history to show only that project's analysis history
4. WHEN I perform a new analysis on a project THEN the system SHALL save the analysis with the current project_id
5. WHEN a project is deleted THEN the system SHALL automatically delete all associated analysis history (cascade delete)

### Requirement 2

**User Story:** As a user, I want the history display to clearly indicate which project the analysis belongs to, so that I can understand the context of each analysis result.

#### Acceptance Criteria

1. WHEN viewing analysis history THEN the system SHALL display the project name or identifier for each analysis entry
2. WHEN there are multiple analyses in the history THEN the system SHALL group them by project context
3. WHEN displaying analysis metadata THEN the system SHALL include project information alongside model and device count
4. WHEN no project is associated with an analysis THEN the system SHALL clearly indicate this state

### Requirement 3

**User Story:** As a user, I want the system to handle project context automatically, so that I don't need to manually specify which project each analysis belongs to.

#### Acceptance Criteria

1. WHEN I perform an analysis THEN the system SHALL automatically associate it with the currently active project
2. WHEN no project is active THEN the system SHALL either prompt for project selection OR create analysis without project association
3. WHEN loading analysis history THEN the system SHALL automatically filter by current project context
4. WHEN the current project changes THEN the system SHALL update the history view accordingly

### Requirement 4

**User Story:** As a user, I want appropriate empty states and error handling when working with project-based history, so that I understand what's happening when there's no data or errors occur.

#### Acceptance Criteria

1. WHEN viewing history for a project with no analyses THEN the system SHALL display a project-specific empty state message
2. WHEN no project is selected THEN the system SHALL display a "select project" message in the history tab
3. WHEN there's an error loading project-specific history THEN the system SHALL display an appropriate error message
4. WHEN a project is deleted while viewing its history THEN the system SHALL gracefully handle the state change

### Requirement 5

**User Story:** As a user, I want the analysis creation process to seamlessly integrate with project context, so that all my analyses are properly organized by project.

#### Acceptance Criteria

1. WHEN I create a new analysis THEN the system SHALL include the current project_id in the API request
2. WHEN the analysis is saved successfully THEN the system SHALL update the project's analysis_count and last_analysis_at
3. WHEN viewing the analysis result THEN the system SHALL display project context information
4. WHEN the analysis fails to save THEN the system SHALL provide clear error messaging about the project context issue

### Requirement 6

**User Story:** As a user, I want the delete functionality to work within project context, so that I can manage analysis history appropriately for each project.

#### Acceptance Criteria

1. WHEN I delete an analysis from history THEN the system SHALL only affect analyses within the current project context
2. WHEN confirming deletion THEN the system SHALL show project context in the confirmation dialog
3. WHEN an analysis is deleted THEN the system SHALL update the project's analysis statistics accordingly
4. WHEN all analyses are deleted from a project THEN the system SHALL show the appropriate empty state for that project