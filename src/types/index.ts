export type Role = 'Admin' | 'Asset Officer' | 'Auditor' | 'Viewer';

export type VerificationStatus = 'Verified' | 'Unverified';

export interface Department {
  id: string;
  name: string;
  acronym: string;
}

export interface Location {
  id: string;
  name: string;
  departmentId: string;
  supervisor: string;
  contactNumber: string;
}

export interface Inspection {
  id: string;
  locationId: string;
  departmentId: string;
  locationName: string;
  supervisor: string;
  contactNumber: string;
  date: string; // ISO date string
  auditor1?: string; // display name
  auditor2?: string; // display name
  status: 'Pending' | 'Complete';
}

export interface AppUser {
  id: string; // UUID (auth.users.id)
  name: string;
  email: string;
  phone?: string;
  departmentId?: string;
  photoURL?: string;
  status: VerificationStatus;
  role: Role[];
}
