export interface FormattedData {
  name: string;
  value: string | number | Date;
}
export interface Record {
  id: string;
  projectDescription: string;
  fileDescription: string;
  dynamicFields: FormattedData[];
  comparismDetails: string;
  refId: string;
  matchId: string[];
  isPrimary: boolean;
  createdAt: string; // ISO date string
}
export interface FullRecords {
  refId: string | null;
  source: Record[];
  target: Record[];
}
