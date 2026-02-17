export type ProjectStatus = "active" | "on_hold" | "completed";

export type Project = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string; 
  description?: string;
};

export const STATUS_LABEL: Record<ProjectStatus | "all", string> = {
  all: "All",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

export type ProjectEditableFields = Pick<
  Project,
  "name" | "clientName" | "startDate" | "endDate" | "description"
>;

export type ProjectUpdate = Partial<ProjectEditableFields>;
