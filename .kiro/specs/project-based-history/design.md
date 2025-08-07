# Design Document

## Overview

This design implements a project-based analysis history system where each analysis is associated with a specific project. The system will automatically filter and display analysis history based on the currently active project, providing a more focused and organized user experience.

## Architecture

### Current State Analysis

The existing system already has the necessary database structure:
- `AIAnalysisHistory` table has both `user_id` and `project_id` fields
- API endpoints support optional `project_id` filtering
- Frontend currently loads all user analyses regardless of project

### Proposed Changes

1. **Frontend Context Management**: Modify AIPanel to use current project context
2. **API Integration**: Update API calls to include project_id filtering
3. **State Management**: Ensure analysis history updates when project changes
4. **UI Updates**: Modify empty states and messaging for project context

## Components and Interfaces

### AIPanel Component Updates

```typescript
interface AIPanelProps {
  open: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  currentProject?: Project | null; // Add project context
}
```

### Project Context Integration

The component will need access to:
- Current active project from ProjectContext
- Project switching events to refresh history
- Project deletion events to handle cleanup

### API Service Updates

```typescript
// Update analysisHistoryAPI calls to include project filtering
const loadAnalysisHistory = async (projectId?: number) => {
  const params = projectId ? { project_id: projectId } : {};
  return await analysisHistoryAPI.getHistory(params);
};
```

## Data Models

### Analysis Creation Flow

1. User performs analysis in project context
2. Frontend sends analysis request with current project_id
3. Backend saves analysis with project association
4. Frontend refreshes project-specific history

### History Retrieval Flow

1. User opens history tab
2. Frontend checks current project context
3. API call includes project_id filter
4. Display filtered results

## Error Handling

### No Project Selected
- Display message: "Select a project to view analysis history"
- Provide link/button to project selection

### Project Deleted While Viewing
- Detect project context loss
- Gracefully redirect to project selection
- Clear history state

### API Errors
- Handle project-specific error messages
- Maintain user context during error recovery

## Testing Strategy

### Unit Tests
- Test project context filtering
- Test empty state handling
- Test project switching scenarios

### Integration Tests
- Test full analysis creation flow with project context
- Test history loading with different project states
- Test project deletion cascade effects

### User Acceptance Tests
- Verify project-specific history display
- Verify analysis creation with project association
- Verify proper cleanup on project deletion